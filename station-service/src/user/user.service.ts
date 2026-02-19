import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/index.js';
import { CreateUserDto, UpdateUserDto } from './dto/index.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    stationId?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    return this.prisma.user.findMany({
      where: {
        ...(filters?.stationId && { stationId: filters.stationId }),
        ...(filters?.role && { role: filters.role }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      select: {
        id: true,
        stationId: true,
        role: true,
        badgeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        stationId: true,
        role: true,
        badgeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouve`);
    }

    // Masquer les utilisateurs désactivés
    if (!user.isActive) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouve`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    // Check for duplicate email
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cet email est deja utilise');
      }
    }

    // Check for duplicate badge
    if (dto.badgeCode) {
      const existingBadge = await this.prisma.user.findUnique({
        where: { badgeCode: dto.badgeCode },
      });
      if (existingBadge) {
        throw new ConflictException('Ce code badge est deja utilise');
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    // Hash PIN if provided
    let pinCodeHash: string | undefined;
    if (dto.pin) {
      pinCodeHash = await bcrypt.hash(dto.pin, 12);
    }

    return this.prisma.user.create({
      data: {
        stationId: dto.stationId,
        role: dto.role,
        badgeCode: dto.badgeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        pinCodeHash,
      },
      select: {
        id: true,
        stationId: true,
        role: true,
        badgeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Check if user exists

    // Check for duplicate email if updating
    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Cet email est deja utilise');
      }
    }

    // Check for duplicate badge if updating
    if (dto.badgeCode) {
      const existingBadge = await this.prisma.user.findFirst({
        where: {
          badgeCode: dto.badgeCode,
          NOT: { id },
        },
      });
      if (existingBadge) {
        throw new ConflictException('Ce code badge est deja utilise');
      }
    }

    // Hash new password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.badgeCode !== undefined && { badgeCode: dto.badgeCode }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        stationId: true,
        role: true,
        badgeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if user exists

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprime avec succes' };
  }

  async resetPin(id: string, pin: string) {
    await this.findOne(id); // Check if user exists

    const pinCodeHash = await bcrypt.hash(pin, 12);

    await this.prisma.user.update({
      where: { id },
      data: { pinCodeHash },
    });

    return { message: 'PIN reinitialise avec succes' };
  }
}
