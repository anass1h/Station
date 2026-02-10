import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles, CurrentUser } from '../auth/decorators/index.js';
import { StationScope } from '../common/decorators/index.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { DeliveryService } from './delivery.service.js';
import { CreateDeliveryDto } from './dto/index.js';

@ApiTags('deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enregistrer une nouvelle livraison' })
  @ApiResponse({
    status: 201,
    description: 'Livraison enregistrée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou capacité dépassée',
  })
  @ApiResponse({ status: 404, description: 'Cuve ou fournisseur non trouvé' })
  @ApiResponse({
    status: 409,
    description: 'Numéro de bon de livraison déjà existant',
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.deliveryService.create(dto, user.id);
  }

  @Get('by-station/:stationId')
  @ApiOperation({ summary: "Récupérer les livraisons d'une station" })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date de début (ISO)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    description: 'Filtrer par fournisseur',
  })
  @ApiQuery({
    name: 'fuelTypeId',
    required: false,
    description: 'Filtrer par type de carburant',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des livraisons de la station',
  })
  async findByStation(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('supplierId') supplierId?: string,
    @Query('fuelTypeId') fuelTypeId?: string,
  ) {
    return this.deliveryService.findByStation(stationId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      supplierId,
      fuelTypeId,
    });
  }

  @Get('by-station/:stationId/summary')
  @ApiOperation({ summary: "Récupérer le résumé des livraisons d'une station" })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date de début (ISO)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiResponse({ status: 200, description: 'Résumé des livraisons' })
  async getStationSummary(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.deliveryService.getStationDeliverySummary(
      stationId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('by-tank/:tankId')
  @ApiOperation({ summary: "Récupérer les livraisons d'une cuve" })
  @ApiParam({ name: 'tankId', description: 'UUID de la cuve' })
  @ApiResponse({ status: 200, description: 'Liste des livraisons de la cuve' })
  async findByTank(@Param('tankId', ParseUUIDPipe) tankId: string) {
    return this.deliveryService.findByTank(tankId);
  }

  @Get('by-supplier/:supplierId')
  @ApiOperation({ summary: "Récupérer les livraisons d'un fournisseur" })
  @ApiParam({ name: 'supplierId', description: 'UUID du fournisseur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des livraisons du fournisseur',
  })
  async findBySupplier(@Param('supplierId', ParseUUIDPipe) supplierId: string) {
    return this.deliveryService.findBySupplier(supplierId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une livraison par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la livraison' })
  @ApiResponse({
    status: 200,
    description: 'Livraison trouvée avec ses relations',
  })
  @ApiResponse({ status: 404, description: 'Livraison non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    return this.deliveryService.findOne(id, stationId);
  }
}
