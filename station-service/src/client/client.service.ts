import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Client, ClientType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateClientDto, UpdateClientDto } from './dto/index.js';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto): Promise<Client> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Si B2B, companyName est obligatoire
    if (dto.clientType === ClientType.B2B && !dto.companyName) {
      throw new BadRequestException(
        "Le nom de l'entreprise est obligatoire pour un client B2B",
      );
    }

    return this.prisma.client.create({
      data: {
        stationId: dto.stationId,
        clientType: dto.clientType,
        companyName: dto.companyName,
        contactName: dto.contactName,
        ice: dto.ice,
        taxId: dto.taxId,
        rc: dto.rc,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        creditLimit: dto.creditLimit ?? 0,
        paymentTermDays: dto.paymentTermDays ?? 30,
      },
      include: {
        station: true,
      },
    });
  }

  async findAll(
    stationId?: string,
    clientType?: ClientType,
  ): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: {
        isActive: true,
        ...(stationId && { stationId }),
        ...(clientType && { clientType }),
      },
      include: {
        station: true,
      },
      orderBy: [{ companyName: 'asc' }, { contactName: 'asc' }],
    });
  }

  async findOne(id: string, userStationId?: string | null): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        station: true,
        sales: {
          take: 20,
          orderBy: { soldAt: 'desc' },
          include: {
            fuelType: true,
          },
        },
        invoices: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            payments: {
              include: { paymentMethod: true },
            },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    // Vérification multi-tenant
    if (userStationId && client.stationId !== userStationId) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    userStationId?: string | null,
  ): Promise<Client> {
    const client = await this.findOne(id, userStationId);

    // Si on change vers B2B, vérifier companyName
    const newClientType = dto.clientType ?? client.clientType;
    const newCompanyName = dto.companyName ?? client.companyName;

    if (newClientType === ClientType.B2B && !newCompanyName) {
      throw new BadRequestException(
        "Le nom de l'entreprise est obligatoire pour un client B2B",
      );
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
      include: {
        station: true,
      },
    });
  }

  async remove(id: string, userStationId?: string | null): Promise<void> {
    await this.findOne(id, userStationId);

    await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateBalance(clientId: string, amount: number): Promise<Client> {
    const client = await this.findOne(clientId);

    const newBalance = Number(client.currentBalance) + amount;

    return this.prisma.client.update({
      where: { id: clientId },
      data: { currentBalance: newBalance },
    });
  }

  async getClientsOverCreditLimit(stationId: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        stationId,
        isActive: true,
        clientType: ClientType.B2B,
      },
      include: {
        station: true,
      },
    });

    return clients.filter(
      (c) =>
        Number(c.currentBalance) > Number(c.creditLimit) &&
        Number(c.creditLimit) > 0,
    );
  }
}
