import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceStatus, InvoiceType, CreditNote, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import {
  CreateInvoiceDto,
  AddPaymentDto,
  CancelInvoiceDto,
  CreateCreditNoteDto,
} from './dto/index.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  PaginatedResponse,
  buildPaginatedResponse,
  toPrismaQuery,
  toDateRangeFilter,
} from '../common/interfaces/paginated-result.interface.js';
import { INVOICE_CONSTANTS, TAX_CONSTANTS } from '../common/constants/business.constants.js';

const VAT_RATE = TAX_CONSTANTS.VAT_RATE_STANDARD;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un numéro de facture séquentiel sécurisé via transaction
   * Format: {stationCode}-{année}-{5 chiffres}
   */
  private async generateInvoiceNumber(
    stationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const station = await tx.station.findUnique({
      where: { id: stationId },
      select: { stationCode: true },
    });

    const stationCode = station?.stationCode || 'STA';
    const year = new Date().getFullYear();
    const prefix = `${stationCode}-${year}`;

    // Compter les factures existantes avec ce préfixe pour obtenir le prochain numéro
    const count = await tx.invoice.count({
      where: {
        stationId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(
      INVOICE_CONSTANTS.SEQUENCE_LENGTH,
      '0',
    );
    return `${prefix}-${sequence}`;
  }

  /**
   * Génère un numéro d'avoir séquentiel
   * Format: AV-{stationCode}-{année}-{séquence}
   */
  private async generateCreditNoteNumber(
    stationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const station = await tx.station.findUnique({
      where: { id: stationId },
      select: { stationCode: true },
    });

    const stationCode = station?.stationCode || 'STA';
    const year = new Date().getFullYear();
    const prefix = `${INVOICE_CONSTANTS.CREDIT_NOTE_PREFIX}-${stationCode}-${year}`;

    const count = await tx.creditNote.count({
      where: {
        stationId,
        creditNoteNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(
      INVOICE_CONSTANTS.SEQUENCE_LENGTH,
      '0',
    );
    return `${prefix}-${sequence}`;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Vérifier le client si fourni
    let client = null;
    if (dto.clientId) {
      client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(
          `Client avec l'ID ${dto.clientId} non trouvé`,
        );
      }
    }

    // Validation DGI pour B2B: ICE station, taxId station, ICE client requis
    if (dto.invoiceType === InvoiceType.B2B) {
      if (!station.ice || !station.taxId) {
        throw new BadRequestException(
          'Pour une facture B2B, la station doit avoir un ICE et un Identifiant Fiscal (IF) renseignés',
        );
      }
      if (client && !client.ice) {
        throw new BadRequestException(
          "Pour une facture B2B, le client doit avoir un ICE renseigné",
        );
      }
    }

    // Vérifier les types de carburant
    for (const line of dto.lines) {
      const fuelType = await this.prisma.fuelType.findUnique({
        where: { id: line.fuelTypeId },
      });

      if (!fuelType) {
        throw new NotFoundException(
          `Type de carburant avec l'ID ${line.fuelTypeId} non trouvé`,
        );
      }
    }

    // Calculer les montants
    const vatRate = VAT_RATE;
    let totalHT = 0;
    let totalVAT = 0;

    const linesData = dto.lines.map((line) => {
      const lineHT = line.quantity * line.unitPriceHT;
      const lineVAT = lineHT * (vatRate / 100);
      const lineTTC = lineHT + lineVAT;

      totalHT += lineHT;
      totalVAT += lineVAT;

      return {
        fuelTypeId: line.fuelTypeId,
        description: line.description,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT,
        totalHT: lineHT,
        vatRate,
        vatAmount: lineVAT,
        totalTTC: lineTTC,
      };
    });

    const totalTTC = totalHT + totalVAT;

    // Créer la facture dans une transaction avec numérotation sécurisée
    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(dto.stationId, tx);

      return tx.invoice.create({
        data: {
          stationId: dto.stationId,
          clientId: dto.clientId,
          invoiceNumber,
          invoiceType: dto.invoiceType,
          status: InvoiceStatus.DRAFT,
          amountHT: totalHT,
          vatRate,
          vatAmount: totalVAT,
          amountTTC: totalTTC,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
          notes: dto.notes,
          lines: {
            create: linesData,
          },
        },
        include: {
          station: true,
          client: true,
          lines: {
            include: { fuelType: true },
          },
          payments: {
            include: { paymentMethod: true },
          },
        },
      });
    });
  }

  async issue(id: string, userStationId?: string | null): Promise<Invoice> {
    const invoice = await this.findOne(id, userStationId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Seule une facture en brouillon peut être émise (status actuel: ${invoice.status})`,
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        dueDate: invoice.client
          ? new Date(
              Date.now() +
                (invoice.client.paymentTermDays || 30) * 24 * 60 * 60 * 1000,
            )
          : null,
      },
      include: {
        station: true,
        client: true,
        lines: { include: { fuelType: true } },
        payments: { include: { paymentMethod: true } },
      },
    });
  }

  async addPayment(
    invoiceId: string,
    dto: AddPaymentDto,
    userStationId?: string | null,
  ): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId, userStationId);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        "Impossible d'ajouter un paiement à une facture annulée",
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cette facture est déjà entièrement payée');
    }

    // Vérifier le moyen de paiement
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: dto.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        `Moyen de paiement avec l'ID ${dto.paymentMethodId} non trouvé`,
      );
    }

    // Vérifier que le montant ne dépasse pas le reste à payer
    const remainingAmount =
      Number(invoice.amountTTC) - Number(invoice.paidAmount);
    if (dto.amount > remainingAmount) {
      throw new BadRequestException(
        `Le montant du paiement (${dto.amount} MAD) dépasse le reste à payer (${remainingAmount.toFixed(2)} MAD)`,
      );
    }

    // Créer le paiement
    await this.prisma.invoicePayment.create({
      data: {
        invoiceId,
        paymentMethodId: dto.paymentMethodId,
        amount: dto.amount,
        reference: dto.reference,
        paymentDate: new Date(dto.paymentDate),
        notes: dto.notes,
      },
    });

    // Mettre à jour le montant payé
    const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
    const newStatus =
      newPaidAmount >= Number(invoice.amountTTC)
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        ...(newStatus === InvoiceStatus.PAID && { paidAt: new Date() }),
      },
      include: {
        station: true,
        client: true,
        lines: { include: { fuelType: true } },
        payments: { include: { paymentMethod: true } },
      },
    });

    // Mettre à jour le solde client si B2B
    if (invoice.clientId && newStatus === InvoiceStatus.PAID) {
      await this.prisma.client.update({
        where: { id: invoice.clientId },
        data: {
          currentBalance: {
            decrement: Number(invoice.amountTTC),
          },
        },
      });
    }

    return updatedInvoice;
  }

  async cancel(
    id: string,
    dto: CancelInvoiceDto,
    userStationId?: string | null,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userStationId);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cette facture est déjà annulée');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        "Impossible d'annuler une facture payée. Créez un avoir à la place.",
      );
    }

    // Si des paiements partiels existent, il faut les gérer
    if (Number(invoice.paidAmount) > 0) {
      throw new BadRequestException(
        'Cette facture a des paiements. Créez un avoir pour régulariser.',
      );
    }

    // Pour une facture ISSUED sans paiements, créer un avoir automatiquement
    if (invoice.status === InvoiceStatus.ISSUED) {
      return this.prisma.$transaction(async (tx) => {
        const creditNoteNumber = await this.generateCreditNoteNumber(
          invoice.stationId,
          tx,
        );

        await tx.creditNote.create({
          data: {
            stationId: invoice.stationId,
            originalInvoiceId: id,
            creditNoteNumber,
            amountHT: invoice.amountHT,
            vatAmount: invoice.vatAmount,
            amountTTC: invoice.amountTTC,
            reason: dto.reason,
            issuedAt: new Date(),
          },
        });

        return tx.invoice.update({
          where: { id },
          data: {
            status: InvoiceStatus.CANCELLED,
            notes: `${invoice.notes || ''}\n\nANNULÉE: ${dto.reason}\nAvoir: ${creditNoteNumber}`.trim(),
          },
          include: {
            station: true,
            client: true,
            lines: { include: { fuelType: true } },
            payments: { include: { paymentMethod: true } },
            creditNotes: true,
          },
        });
      });
    }

    // DRAFT: annulation simple
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: `${invoice.notes || ''}\n\nANNULÉE: ${dto.reason}`.trim(),
      },
      include: {
        station: true,
        client: true,
        lines: { include: { fuelType: true } },
        payments: { include: { paymentMethod: true } },
      },
    });
  }

  /**
   * Crée un avoir (CreditNote) pour une facture
   */
  async createCreditNote(
    invoiceId: string,
    dto: CreateCreditNoteDto,
    userStationId?: string | null,
  ): Promise<CreditNote> {
    const invoice = await this.findOne(invoiceId, userStationId);

    // Valider que la facture est ISSUED ou PARTIALLY_PAID
    if (
      invoice.status !== InvoiceStatus.ISSUED &&
      invoice.status !== InvoiceStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException(
        `Impossible de créer un avoir pour une facture ${invoice.status}. La facture doit être ISSUED ou PARTIALLY_PAID.`,
      );
    }

    // Calculer les montants de l'avoir
    let amountHT: number;
    if (dto.partialAmountHT != null) {
      if (dto.partialAmountHT > Number(invoice.amountHT)) {
        throw new BadRequestException(
          `Le montant HT de l'avoir (${dto.partialAmountHT} MAD) ne peut pas dépasser le montant HT de la facture (${Number(invoice.amountHT).toFixed(2)} MAD)`,
        );
      }
      amountHT = dto.partialAmountHT;
    } else {
      amountHT = Number(invoice.amountHT);
    }

    const vatAmount = amountHT * (Number(invoice.vatRate) / 100);
    const amountTTC = amountHT + vatAmount;

    return this.prisma.$transaction(async (tx) => {
      const creditNoteNumber = await this.generateCreditNoteNumber(
        invoice.stationId,
        tx,
      );

      const creditNote = await tx.creditNote.create({
        data: {
          stationId: invoice.stationId,
          originalInvoiceId: invoiceId,
          creditNoteNumber,
          amountHT,
          vatAmount,
          amountTTC,
          reason: dto.reason,
          issuedAt: new Date(),
        },
      });

      // Mettre à jour le statut de la facture à CANCELLED
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.CANCELLED,
          notes: `${invoice.notes || ''}\n\nAvoir émis: ${creditNoteNumber} - ${dto.reason}`.trim(),
        },
      });

      // Ajuster le solde client si nécessaire
      if (invoice.clientId) {
        await tx.client.update({
          where: { id: invoice.clientId },
          data: {
            currentBalance: {
              decrement: amountTTC,
            },
          },
        });
      }

      this.logger.log(
        `Avoir ${creditNoteNumber} créé pour la facture ${invoice.invoiceNumber} (${amountTTC.toFixed(2)} MAD TTC)`,
      );

      return creditNote;
    });
  }

  async findOne(
    id: string,
    userStationId?: string | null,
  ): Promise<Invoice & { client: { paymentTermDays: number; ice?: string | null } | null }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        station: true,
        client: true,
        lines: {
          include: { fuelType: true },
        },
        payments: {
          include: { paymentMethod: true },
          orderBy: { paymentDate: 'asc' },
        },
        creditNotes: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant
    if (userStationId && invoice.stationId !== userStationId) {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    return invoice;
  }

  async findByClient(clientId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { clientId },
      include: {
        lines: { include: { fuelType: true } },
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(
    pagination: PaginationDto,
    stationId?: string | null,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      clientId?: string;
      status?: InvoiceStatus;
      invoiceType?: InvoiceType;
    },
  ): Promise<PaginatedResponse<Invoice>> {
    const { page = 1, perPage = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take, orderBy } = toPrismaQuery(page, perPage, sortBy, sortOrder);

    const dateFilter = toDateRangeFilter(filters?.dateFrom, filters?.dateTo);

    const where = {
      ...(stationId && { stationId }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.invoiceType && { invoiceType: filters.invoiceType }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: {
          station: true,
          client: true,
          lines: { include: { fuelType: true } },
          payments: { include: { paymentMethod: true } },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async findByStation(
    stationId: string,
    filters?: {
      status?: InvoiceStatus;
      invoiceType?: InvoiceType;
      clientId?: string;
      from?: Date;
      to?: Date;
    },
  ): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        stationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.invoiceType && { invoiceType: filters.invoiceType }),
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...((filters?.from || filters?.to) && {
          createdAt: {
            ...(filters?.from && { gte: filters.from }),
            ...(filters?.to && { lte: filters.to }),
          },
        }),
      },
      include: {
        client: true,
        lines: { include: { fuelType: true } },
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnpaidInvoices(stationId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        stationId,
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
        },
      },
      include: {
        client: true,
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getOverdueInvoices(stationId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        stationId,
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        client: true,
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
