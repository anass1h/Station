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
import { Roles } from '../auth/decorators/index.js';
import { StationScope } from '../common/decorators/index.js';
import { SaleService } from './sale.service.js';
import { CreateSaleDto } from './dto/index.js';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @Roles(UserRole.POMPISTE, UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enregistrer une nouvelle vente' })
  @ApiResponse({ status: 201, description: 'Vente enregistrée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou shift non ouvert',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift, type de carburant ou client non trouvé',
  })
  async create(@Body() dto: CreateSaleDto) {
    return this.saleService.create(dto);
  }

  @Get('recent')
  @ApiOperation({ summary: "Récupérer les ventes récentes d'une station" })
  @ApiQuery({
    name: 'stationId',
    required: true,
    description: 'UUID de la station',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre de ventes (défaut: 10)',
  })
  @ApiResponse({ status: 200, description: 'Liste des ventes récentes' })
  async findRecent(
    @Query('stationId', ParseUUIDPipe) stationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.saleService.findRecent(
      stationId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('by-shift/:shiftId')
  @ApiOperation({ summary: "Récupérer les ventes d'un shift" })
  @ApiParam({ name: 'shiftId', description: 'UUID du shift' })
  @ApiResponse({ status: 200, description: 'Liste des ventes du shift' })
  async findByShift(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.saleService.findByShift(shiftId);
  }

  @Get('by-shift/:shiftId/summary')
  @ApiOperation({ summary: "Récupérer le résumé des ventes d'un shift" })
  @ApiParam({ name: 'shiftId', description: 'UUID du shift' })
  @ApiResponse({
    status: 200,
    description: 'Résumé des ventes (totaux, par type, par paiement)',
  })
  async getShiftSummary(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.saleService.getShiftSummary(shiftId);
  }

  @Get('by-station/:stationId')
  @ApiOperation({ summary: "Récupérer les ventes d'une station" })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date de début (ISO)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiQuery({
    name: 'fuelTypeId',
    required: false,
    description: 'Filtrer par type de carburant',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filtrer par client',
  })
  @ApiResponse({ status: 200, description: 'Liste des ventes de la station' })
  async findByStation(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('fuelTypeId') fuelTypeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.saleService.findByStation(stationId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      fuelTypeId,
      clientId,
    });
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: "Récupérer les ventes d'un client" })
  @ApiParam({ name: 'clientId', description: 'UUID du client' })
  @ApiResponse({ status: 200, description: 'Liste des ventes du client' })
  async findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.saleService.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une vente par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  @ApiResponse({ status: 200, description: 'Vente trouvée avec ses relations' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    return this.saleService.findOne(id, stationId);
  }
}
