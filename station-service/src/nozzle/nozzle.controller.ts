import {
  Body,
  Controller,
  Delete,
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
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { StationScope } from '../common/decorators/index.js';
import { NozzleService } from './nozzle.service.js';
import { CreateNozzleDto, UpdateNozzleDto } from './dto/index.js';

@ApiTags('nozzles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nozzles')
export class NozzleController {
  constructor(private readonly nozzleService: NozzleService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau pistolet' })
  @ApiResponse({ status: 201, description: 'Pistolet créé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Type de carburant incohérent avec la cuve',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({
    status: 404,
    description: 'Distributeur, cuve ou type de carburant non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Référence déjà existante sur le distributeur',
  })
  async create(@Body() dto: CreateNozzleDto) {
    return this.nozzleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les pistolets actifs' })
  @ApiQuery({
    name: 'dispenserId',
    required: false,
    description: 'Filtrer par distributeur',
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiResponse({ status: 200, description: 'Liste des pistolets' })
  async findAll(
    @Query('dispenserId') dispenserId?: string,
    @Query('stationId') stationId?: string,
  ) {
    return this.nozzleService.findAll(dispenserId, stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un pistolet par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du pistolet' })
  @ApiResponse({
    status: 200,
    description: 'Pistolet trouvé avec ses relations',
  })
  @ApiResponse({ status: 404, description: 'Pistolet non trouvé' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    return this.nozzleService.findOne(id, stationId);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un pistolet' })
  @ApiParam({ name: 'id', description: 'UUID du pistolet' })
  @ApiResponse({ status: 200, description: 'Pistolet mis à jour' })
  @ApiResponse({
    status: 400,
    description: 'Type de carburant incohérent avec la cuve',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({
    status: 404,
    description: 'Pistolet, cuve ou type de carburant non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Référence déjà existante sur le distributeur',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNozzleDto,
    @StationScope() stationId: string | null,
  ) {
    return this.nozzleService.update(id, dto, stationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un pistolet (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du pistolet' })
  @ApiResponse({ status: 200, description: 'Pistolet désactivé' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - SUPER_ADMIN uniquement',
  })
  @ApiResponse({ status: 404, description: 'Pistolet non trouvé' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    await this.nozzleService.remove(id, stationId);
    return { message: 'Pistolet désactivé avec succès' };
  }
}
