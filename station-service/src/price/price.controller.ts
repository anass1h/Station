import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { Roles, CurrentUser } from '../auth/decorators/index.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { PriceService } from './price.service.js';
import { CreatePriceDto } from './dto/index.js';

@ApiTags('prices')
@ApiBearerAuth()
@Controller('prices')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Créer un nouveau prix (clôture automatiquement l'ancien)",
  })
  @ApiResponse({ status: 201, description: 'Prix créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 404,
    description: 'Station ou type de carburant non trouvé',
  })
  async create(
    @Body() dto: CreatePriceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.priceService.create(dto, user.id);
  }

  @Get('current/:stationId')
  @ApiOperation({ summary: "Récupérer tous les prix actifs d'une station" })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Liste des prix actifs' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  async findAllCurrent(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.priceService.findAllCurrent(stationId);
  }

  @Get('current/:stationId/:fuelTypeId')
  @ApiOperation({
    summary: 'Récupérer le prix actif pour un type de carburant',
  })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiParam({ name: 'fuelTypeId', description: 'UUID du type de carburant' })
  @ApiResponse({ status: 200, description: 'Prix actif trouvé' })
  @ApiResponse({ status: 200, description: 'Aucun prix actif (retourne null)' })
  async getCurrentPrice(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Param('fuelTypeId', ParseUUIDPipe) fuelTypeId: string,
  ) {
    return this.priceService.getCurrentPrice(stationId, fuelTypeId);
  }

  @Get('history/:stationId/:fuelTypeId')
  @ApiOperation({ summary: "Récupérer l'historique des prix" })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiParam({ name: 'fuelTypeId', description: 'UUID du type de carburant' })
  @ApiResponse({ status: 200, description: 'Historique des prix' })
  @ApiResponse({
    status: 404,
    description: 'Station ou type de carburant non trouvé',
  })
  async getPriceHistory(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Param('fuelTypeId', ParseUUIDPipe) fuelTypeId: string,
  ) {
    return this.priceService.getPriceHistory(stationId, fuelTypeId);
  }

  @Get('at-date/:stationId/:fuelTypeId')
  @ApiOperation({ summary: 'Récupérer le prix à une date donnée' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiParam({ name: 'fuelTypeId', description: 'UUID du type de carburant' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date (ISO format)',
    example: '2026-01-15',
  })
  @ApiResponse({ status: 200, description: 'Prix à la date spécifiée' })
  @ApiResponse({
    status: 200,
    description: 'Aucun prix à cette date (retourne null)',
  })
  async getPriceAtDate(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Param('fuelTypeId', ParseUUIDPipe) fuelTypeId: string,
    @Query('date') dateStr: string,
  ) {
    const date = new Date(dateStr);
    return this.priceService.getPriceAtDate(stationId, fuelTypeId, date);
  }

  @Get()
  @ApiOperation({
    summary: "Récupérer l'historique complet des prix avec filtres",
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'fuelTypeId',
    required: false,
    description: 'Filtrer par type de carburant',
  })
  @ApiResponse({ status: 200, description: 'Liste des prix' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('fuelTypeId') fuelTypeId?: string,
  ) {
    return this.priceService.findAll(stationId, fuelTypeId);
  }
}
