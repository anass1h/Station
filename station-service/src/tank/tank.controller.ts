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
import { TankService } from './tank.service.js';
import { CreateTankDto, UpdateTankDto } from './dto/index.js';

@ApiTags('tanks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tanks')
export class TankController {
  constructor(private readonly tankService: TankService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle cuve' })
  @ApiResponse({ status: 201, description: 'Cuve créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides (niveau > capacité)' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Station ou type de carburant non trouvé' })
  @ApiResponse({ status: 409, description: 'Référence déjà existante dans la station' })
  async create(@Body() dto: CreateTankDto) {
    return this.tankService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les cuves actives' })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiResponse({ status: 200, description: 'Liste des cuves' })
  async findAll(@Query('stationId') stationId?: string) {
    return this.tankService.findAll(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une cuve par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la cuve' })
  @ApiResponse({ status: 200, description: 'Cuve trouvée avec ses relations' })
  @ApiResponse({ status: 404, description: 'Cuve non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tankService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une cuve' })
  @ApiParam({ name: 'id', description: 'UUID de la cuve' })
  @ApiResponse({ status: 200, description: 'Cuve mise à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides (niveau > capacité)' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Cuve non trouvée' })
  @ApiResponse({ status: 409, description: 'Référence déjà existante dans la station' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTankDto,
  ) {
    return this.tankService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver une cuve (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID de la cuve' })
  @ApiResponse({ status: 200, description: 'Cuve désactivée' })
  @ApiResponse({ status: 403, description: 'Accès refusé - SUPER_ADMIN uniquement' })
  @ApiResponse({ status: 404, description: 'Cuve non trouvée' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tankService.remove(id);
    return { message: 'Cuve désactivée avec succès' };
  }
}
