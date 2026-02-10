import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: dto,
    });
  }

  async findAll(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        deliveries: {
          take: 10,
          orderBy: { deliveredAt: 'desc' },
          include: {
            tank: {
              include: {
                station: true,
                fuelType: true,
              },
            },
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    // Masquer les fournisseurs désactivés
    if (!supplier.isActive) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.findOne(id);

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
