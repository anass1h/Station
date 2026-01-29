import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceStatus, InvoiceType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateInvoiceDto, AddPaymentDto, CancelInvoiceDto } from './dto/index.js';

const VAT_RATE = 20; // Taux TVA Maroc

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(stationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        stationId,
        invoiceNumber: {
          startsWith: `FAC-${year}`,
        },
      },
    });
    return `FAC-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(`Station avec l'ID ${dto.stationId} non trouvée`);
    }

    // Vérifier le client si fourni
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client avec l'ID ${dto.clientId} non trouvé`);
      }
    }

    // Vérifier les types de carburant
    for (const line of dto.lines) {
      const fuelType = await this.prisma.fuelType.findUnique({
        where: { id: line.fuelTypeId },
      });

      if (!fuelType) {
        throw new NotFoundException(`Type de carburant avec l'ID ${line.fuelTypeId} non trouvé`);
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

    // Générer le numéro de facture
    const invoiceNumber = await this.generateInvoiceNumber(dto.stationId);

    // Créer la facture
    return this.prisma.invoice.create({
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
  }

  async issue(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

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
          ? new Date(Date.now() + (invoice.client.paymentTermDays || 30) * 24 * 60 * 60 * 1000)
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

  async addPayment(invoiceId: string, dto: AddPaymentDto): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Impossible d\'ajouter un paiement à une facture annulée');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cette facture est déjà entièrement payée');
    }

    // Vérifier le moyen de paiement
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: dto.paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Moyen de paiement avec l'ID ${dto.paymentMethodId} non trouvé`);
    }

    // Vérifier que le montant ne dépasse pas le reste à payer
    const remainingAmount = Number(invoice.amountTTC) - Number(invoice.paidAmount);
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

  async cancel(id: string, dto: CancelInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cette facture est déjà annulée');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        'Impossible d\'annuler une facture payée. Créez un avoir à la place.',
      );
    }

    // Si des paiements partiels existent, il faut les gérer
    if (Number(invoice.paidAmount) > 0) {
      throw new BadRequestException(
        'Cette facture a des paiements. Créez un avoir pour régulariser.',
      );
    }

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

  async findOne(id: string): Promise<Invoice & { client: { paymentTermDays: number } | null }> {
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
