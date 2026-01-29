import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { DashboardService } from './dashboard.service.js';
import { PompisteDebtService } from '../pompiste-debt/index.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly pompisteDebtService: PompisteDebtService,
  ) {}

  @Get('daily/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Résumé journalier d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD), défaut: aujourd\'hui' })
  @ApiResponse({ status: 200, description: 'Résumé journalier' })
  async getDailySummary(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.dashboardService.getDailySummary(stationId, date);
  }

  @Get('monthly/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Résumé mensuel d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({ name: 'year', required: false, description: 'Année, défaut: année courante' })
  @ApiQuery({ name: 'month', required: false, description: 'Mois (1-12), défaut: mois courant' })
  @ApiResponse({ status: 200, description: 'Résumé mensuel' })
  async getMonthlySummary(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.dashboardService.getMonthlySummary(stationId, year, month);
  }

  @Get('stock/:stationId')
  @ApiOperation({ summary: 'État des stocks d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'État des stocks' })
  async getStockStatus(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.dashboardService.getStockStatus(stationId);
  }

  @Get('pompiste/:pompisteId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Performance d\'un pompiste' })
  @ApiParam({ name: 'pompisteId', description: 'UUID du pompiste' })
  @ApiQuery({ name: 'from', required: false, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Performance du pompiste' })
  async getPompistePerformance(
    @Param('pompisteId', ParseUUIDPipe) pompisteId: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const now = new Date();
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toStr ? new Date(toStr) : now;
    return this.dashboardService.getPompistePerformance(pompisteId, from, to);
  }

  @Get('financial/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Résumé financier d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({ name: 'year', required: false, description: 'Année, défaut: année courante' })
  @ApiQuery({ name: 'month', required: false, description: 'Mois (1-12), défaut: mois courant' })
  @ApiResponse({ status: 200, description: 'Résumé financier' })
  async getFinancialSummary(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.dashboardService.getFinancialSummary(stationId, year, month);
  }

  @Get('alerts/:stationId')
  @ApiOperation({ summary: 'Vue d\'ensemble des alertes d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Vue d\'ensemble des alertes' })
  async getAlertsOverview(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.dashboardService.getAlertsOverview(stationId);
  }

  @Get('debts/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Vue d\'ensemble des dettes des pompistes d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Vue d\'ensemble des dettes' })
  async getDebtsOverview(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.pompisteDebtService.getDebtsOverview(stationId);
  }

  @Get('global')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Résumé consolidé de toutes les stations' })
  @ApiQuery({ name: 'year', required: false, description: 'Année, défaut: année courante' })
  @ApiQuery({ name: 'month', required: false, description: 'Mois (1-12), défaut: mois courant' })
  @ApiResponse({ status: 200, description: 'Résumé global' })
  async getGlobalSummary(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.dashboardService.getGlobalSummary(year, month);
  }
}
