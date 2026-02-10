import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/index.js';
import { StationScope } from '../common/decorators/index.js';
import { StationService } from './station.service.js';
import { CreateStationDto, UpdateStationDto } from './dto/index.js';

@ApiTags('stations')
@ApiBearerAuth()
@Controller('stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle station' })
  @ApiResponse({ status: 201, description: 'Station créée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() dto: CreateStationDto) {
    return this.stationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les stations actives' })
  @ApiResponse({ status: 200, description: 'Liste des stations' })
  async findAll(@StationScope() stationId: string | null) {
    return this.stationService.findAll(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une station par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Station trouvée' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    return this.stationService.findOne(id, stationId);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une station' })
  @ApiParam({ name: 'id', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Station mise à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStationDto,
    @StationScope() stationId: string | null,
  ) {
    return this.stationService.update(id, dto, stationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver une station (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Station désactivée' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - SUPER_ADMIN uniquement',
  })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    await this.stationService.remove(id, stationId);
    return { message: 'Station désactivée avec succès' };
  }
}
