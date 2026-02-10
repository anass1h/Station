import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
import { LicenceService, LicenceCheckResult } from './licence.service';
import {
  CreateLicenceDto,
  UpdateLicenceDto,
  ExtendLicenceDto,
  SuspendLicenceDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { SkipStationScope } from '../common/guards/index.js';
import type { AuthenticatedUser } from '../auth/strategies/index.js';
import { Licence } from '@prisma/client';

@ApiTags('licences')
@SkipStationScope()
@Controller('licences')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LicenceController {
  constructor(private readonly licenceService: LicenceService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer une licence pour une station' })
  @ApiResponse({ status: 201, description: 'Licence créée' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  @ApiResponse({ status: 409, description: 'Licence déjà existante' })
  async create(@Body() dto: CreateLicenceDto): Promise<Licence> {
    return this.licenceService.create(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Lister toutes les licences' })
  @ApiResponse({ status: 200, description: 'Liste des licences' })
  async findAll(): Promise<Licence[]> {
    return this.licenceService.findAll();
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

  @Get('expired')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Licences expirées mais encore marquées ACTIVE' })
  @ApiResponse({ status: 200, description: 'Liste des licences expirées' })
  async getExpiredLicences(): Promise<Licence[]> {
    return this.licenceService.getExpiredLicences();
  }

  @Post('process-expired')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Traiter les licences expirées (batch)' })
  @ApiResponse({ status: 200, description: 'Nombre de licences traitées' })
  async processExpiredLicences(): Promise<{ processed: number }> {
    const count = await this.licenceService.processExpiredLicences();
    return { processed: count };
  }

  @Get('station/:stationId')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: "Récupérer la licence d'une station" })
  @ApiResponse({ status: 200, description: 'Licence de la station' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async findByStation(
    @Param('stationId', ParseUUIDPipe) stationId: string,
  ): Promise<Licence | null> {
    return this.licenceService.findByStation(stationId);
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

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Récupérer une licence par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la licence' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Licence> {
    return this.licenceService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Modifier une licence' })
  @ApiResponse({ status: 200, description: 'Licence modifiée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLicenceDto,
  ): Promise<Licence> {
    return this.licenceService.update(id, dto);
  }

  @Post(':id/suspend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspendre une licence' })
  @ApiResponse({ status: 200, description: 'Licence suspendue' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendLicenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Licence> {
    return this.licenceService.suspend(
      id,
      dto.reason,
      user.id,
      user.stationId ?? undefined,
    );
  }

  @Post(':id/reactivate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Réactiver une licence' })
  @ApiResponse({ status: 200, description: 'Licence réactivée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  @ApiResponse({ status: 409, description: 'Licence déjà active ou expirée' })
  async reactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Licence> {
    return this.licenceService.reactivate(id);
  }

  @Post(':id/extend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Prolonger une licence' })
  @ApiResponse({ status: 200, description: 'Licence prolongée' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendLicenceDto,
  ): Promise<Licence> {
    return this.licenceService.extend(id, dto.months);
  }
}
