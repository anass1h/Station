import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AlertPriority, AlertStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles, CurrentUser } from '../auth/decorators/index.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { AlertService } from './alert.service.js';
import { AlertTriggerService } from './alert-trigger.service.js';
import { CreateAlertDto } from './dto/index.js';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly alertTriggerService: AlertTriggerService,
  ) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une alerte manuellement' })
  @ApiResponse({ status: 201, description: 'Alerte créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() dto: CreateAlertDto) {
    return this.alertService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les alertes avec filtres' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'priority', required: false, enum: AlertPriority, description: 'Filtrer par priorité' })
  @ApiResponse({ status: 200, description: 'Liste des alertes' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('status') status?: AlertStatus,
    @Query('priority') priority?: AlertPriority,
  ) {
    return this.alertService.findAll(stationId, status, priority);
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les alertes actives' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiResponse({ status: 200, description: 'Liste des alertes actives' })
  async findAllActive(@Query('stationId') stationId?: string) {
    return this.alertService.findAll(stationId, AlertStatus.ACTIVE);
  }

  @Get('count')
  @ApiOperation({ summary: 'Compter les alertes actives' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiResponse({ status: 200, description: 'Nombre d\'alertes actives' })
  async countActive(@Query('stationId') stationId?: string) {
    const count = await this.alertService.countActive(stationId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une alerte par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l\'alerte' })
  @ApiResponse({ status: 200, description: 'Alerte trouvée' })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id/acknowledge')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Acquitter une alerte' })
  @ApiParam({ name: 'id', description: 'UUID de l\'alerte' })
  @ApiResponse({ status: 200, description: 'Alerte acquittée' })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alertService.acknowledge(id, user.id);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Résoudre une alerte' })
  @ApiParam({ name: 'id', description: 'UUID de l\'alerte' })
  @ApiResponse({ status: 200, description: 'Alerte résolue' })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alertService.resolve(id, user.id);
  }

  @Patch(':id/ignore')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ignorer une alerte' })
  @ApiParam({ name: 'id', description: 'UUID de l\'alerte' })
  @ApiResponse({ status: 200, description: 'Alerte ignorée' })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async ignore(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertService.ignore(id);
  }

  @Post('trigger/check-all')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Exécuter toutes les vérifications d\'alertes' })
  @ApiResponse({ status: 200, description: 'Vérifications exécutées' })
  async triggerAllChecks() {
    return this.alertTriggerService.runAllChecks();
  }

  @Post('trigger/low-stock')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Vérifier les stocks bas de toutes les cuves' })
  @ApiResponse({ status: 200, description: 'Vérification exécutée' })
  async triggerLowStockCheck() {
    const tanks = await this.alertTriggerService['prisma'].tank.findMany({
      where: { isActive: true },
    });

    for (const tank of tanks) {
      await this.alertTriggerService.checkLowStock(tank);
    }

    return { message: `${tanks.length} cuve(s) vérifiée(s)` };
  }

  @Post('trigger/shift-duration')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Vérifier les shifts ouverts trop longtemps' })
  @ApiQuery({ name: 'maxHours', required: false, description: 'Durée max en heures (défaut: 12)' })
  @ApiResponse({ status: 200, description: 'Vérification exécutée' })
  async triggerShiftDurationCheck(@Query('maxHours') maxHours?: string) {
    const hours = maxHours ? parseInt(maxHours, 10) : 12;
    await this.alertTriggerService.checkShiftDuration(hours);
    return { message: 'Vérification des shifts exécutée' };
  }

  @Post('trigger/maintenance')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Vérifier les maintenances à venir ou en retard' })
  @ApiQuery({ name: 'daysAhead', required: false, description: 'Jours à l\'avance (défaut: 7)' })
  @ApiResponse({ status: 200, description: 'Vérification exécutée' })
  async triggerMaintenanceCheck(@Query('daysAhead') daysAhead?: string) {
    const days = daysAhead ? parseInt(daysAhead, 10) : 7;
    await this.alertTriggerService.checkMaintenanceDue(days);
    return { message: 'Vérification des maintenances exécutée' };
  }
}
