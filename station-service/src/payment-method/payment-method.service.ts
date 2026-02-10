import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/index.js';

@Injectable()
export class PaymentMethodService {
  private readonly logger = new Logger(PaymentMethodService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    // Vérifier que le code est unique
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Un moyen de paiement avec le code "${dto.code}" existe déjà`,
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        requiresReference: dto.requiresReference,
        isActive: true,
      },
    });

    this.logger.log(
      `Moyen de paiement créé: ${paymentMethod.code} - ${paymentMethod.name}`,
    );

    return paymentMethod;
  }

  async findAll(includeInactive = false): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        `Moyen de paiement avec l'ID ${id} non trouvé`,
      );
    }

    // Masquer les moyens de paiement désactivés
    if (!paymentMethod.isActive) {
      throw new NotFoundException(
        `Moyen de paiement avec l'ID ${id} non trouvé`,
      );
    }

    return paymentMethod;
  }

  async findByCode(code: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async update(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    // Vérifier que le moyen de paiement existe
    await this.findOne(id);

    const paymentMethod = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.requiresReference !== undefined && {
          requiresReference: dto.requiresReference,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Moyen de paiement mis à jour: ${paymentMethod.code}`);

    return paymentMethod;
  }

  async remove(id: string): Promise<PaymentMethod> {
    // Vérifier que le moyen de paiement existe
    const paymentMethod = await this.findOne(id);

    // Vérifier qu'aucune SalePayment n'utilise ce moyen de paiement
    const salePaymentCount = await this.prisma.salePayment.count({
      where: { paymentMethodId: id },
    });

    if (salePaymentCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer: ${salePaymentCount} paiement(s) de vente utilisent ce moyen de paiement`,
      );
    }

    // Vérifier qu'aucun PaymentDetail n'utilise ce moyen de paiement
    const paymentDetailCount = await this.prisma.paymentDetail.count({
      where: { paymentMethodId: id },
    });

    if (paymentDetailCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer: ${paymentDetailCount} détail(s) de caisse utilisent ce moyen de paiement`,
      );
    }

    // Vérifier qu'aucun InvoicePayment n'utilise ce moyen de paiement
    const invoicePaymentCount = await this.prisma.invoicePayment.count({
      where: { paymentMethodId: id },
    });

    if (invoicePaymentCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer: ${invoicePaymentCount} règlement(s) de facture utilisent ce moyen de paiement`,
      );
    }

    // Soft delete
    const deleted = await this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Moyen de paiement désactivé: ${paymentMethod.code}`);

    return deleted;
  }
}
