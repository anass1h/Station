import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { LicenceService, LicenceCheckResult } from './licence.service.js';
import {
  CreateLicenceDto,
  SuspendLicenceDto,
  ReactivateLicenceDto,
  ExtendLicenceDto,
} from './dto/index.js';
import { Roles } from '../auth/decorators/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { SkipStationScope } from '../common/guards/index.js';
import type { AuthenticatedUser } from '../auth/strategies/index.js';
import { Licence } from '@prisma/client';

@ApiTags('Licences — Super Admin')
@ApiBearerAuth()
@SkipStationScope()
@Controller('licences')
export class LicenceController {
  constructor(private readonly licenceService: LicenceService) {}

  // ═══════════════════════════════════════
  // LECTURE
  // ═══════════════════════════════════════

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Lister toutes les licences avec infos station' })
  @ApiResponse({ status: 200, description: 'Liste des licences' })
  async findAll(): Promise<any[]> {
    return this.licenceService.findAll();
  }

  @Get('stats')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Statistiques des licences (KPI)' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getStats() {
    return this.licenceService.getAdminStats();
  }

  @Get('station/:stationId')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: "Détail complet d'une licence par station" })
  @ApiResponse({ status: 200, description: 'Détail licence + usage' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async findDetailByStation(
    @Param('stationId', ParseUUIDPipe) stationId: string,
  ) {
    return this.licenceService.findDetailByStation(stationId);
  }

  @Get('check/:stationId')
  @Roles('GESTIONNAIRE', 'SUPER_ADMIN')
  @ApiOperation({ summary: "Vérifier la validité d'une licence" })
  @ApiResponse({ status: 200, description: 'Résultat de la vérification' })
  async checkLicence(
    @Param('stationId', ParseUUIDPipe) stationId: string,
  ): Promise<LicenceCheckResult> {
    return this.licenceService.checkLicence(stationId);
  }

  @Get('expiring')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Licences expirant bientôt' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Nombre de jours (défaut: 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des licences expirant bientôt',
  })
  async getExpiringLicences(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<Licence[]> {
    return this.licenceService.getExpiringLicences(days);
  }

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer une licence BETA pour une station' })
  @ApiResponse({ status: 201, description: 'Licence créée' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  @ApiResponse({ status: 409, description: 'Licence déjà existante' })
  async create(@Body() dto: CreateLicenceDto): Promise<Licence> {
    return this.licenceService.create(dto);
  }

  @Patch('station/:stationId/suspend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspendre la licence d\'une station' })
  @ApiResponse({ status: 200, description: 'Licence suspendue' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  @ApiResponse({ status: 409, description: 'Déjà suspendue' })
  async suspend(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Body() dto: SuspendLicenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Licence> {
    return this.licenceService.suspend(stationId, dto, user.id);
  }

  @Patch('station/:stationId/reactivate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Réactiver la licence d\'une station' })
  @ApiResponse({ status: 200, description: 'Licence réactivée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  @ApiResponse({ status: 409, description: 'Déjà active' })
  async reactivate(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Body() dto: ReactivateLicenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Licence> {
    return this.licenceService.reactivate(stationId, dto, user.id);
  }

  @Patch('station/:stationId/extend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Prolonger la licence d\'une station' })
  @ApiResponse({ status: 200, description: 'Licence prolongée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async extend(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Body() dto: ExtendLicenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Licence> {
    return this.licenceService.extend(stationId, dto, user.id);
  }

  @Post('process-expired')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Traiter les licences expirées (batch)' })
  @ApiResponse({ status: 200, description: 'Nombre de licences traitées' })
  async processExpiredLicences(): Promise<{ processed: number }> {
    const count = await this.licenceService.processExpiredLicences();
    return { processed: count };
  }
}
