import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { PaymentMethodService } from './payment-method.service.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/index.js';

@ApiTags('payment-methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau moyen de paiement' })
  @ApiResponse({ status: 201, description: 'Moyen de paiement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Code déjà utilisé' })
  async create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les moyens de paiement actifs' })
  @ApiResponse({ status: 200, description: 'Liste des moyens de paiement actifs' })
  async findAll() {
    return this.paymentMethodService.findAll(false);
  }

  @Get('all')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lister tous les moyens de paiement (inclus inactifs)' })
  @ApiResponse({ status: 200, description: 'Liste de tous les moyens de paiement' })
  async findAllIncludingInactive() {
    return this.paymentMethodService.findAll(true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un moyen de paiement par ID' })
  @ApiParam({ name: 'id', description: 'UUID du moyen de paiement' })
  @ApiResponse({ status: 200, description: 'Moyen de paiement trouvé' })
  @ApiResponse({ status: 404, description: 'Moyen de paiement non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un moyen de paiement (code immutable)' })
  @ApiParam({ name: 'id', description: 'UUID du moyen de paiement' })
  @ApiResponse({ status: 200, description: 'Moyen de paiement mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Moyen de paiement non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un moyen de paiement (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du moyen de paiement' })
  @ApiResponse({ status: 200, description: 'Moyen de paiement désactivé' })
  @ApiResponse({ status: 404, description: 'Moyen de paiement non trouvé' })
  @ApiResponse({ status: 409, description: 'Moyen de paiement utilisé par des paiements' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodService.remove(id);
  }
}
