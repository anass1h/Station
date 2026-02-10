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
import { FuelTypeService } from './fuel-type.service.js';
import { CreateFuelTypeDto, UpdateFuelTypeDto } from './dto/index.js';

@ApiTags('fuel-types')
@ApiBearerAuth()
@Controller('fuel-types')
export class FuelTypeController {
  constructor(private readonly fuelTypeService: FuelTypeService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau type de carburant' })
  @ApiResponse({
    status: 201,
    description: 'Type de carburant créé avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async create(@Body() dto: CreateFuelTypeDto) {
    return this.fuelTypeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types de carburant actifs' })
  @ApiResponse({ status: 200, description: 'Liste des types de carburant' })
  async findAll() {
    return this.fuelTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un type de carburant par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du type de carburant' })
  @ApiResponse({ status: 200, description: 'Type de carburant trouvé' })
  @ApiResponse({ status: 404, description: 'Type de carburant non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fuelTypeService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un type de carburant' })
  @ApiParam({ name: 'id', description: 'UUID du type de carburant' })
  @ApiResponse({ status: 200, description: 'Type de carburant mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Type de carburant non trouvé' })
  @ApiResponse({ status: 409, description: 'Code déjà existant' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFuelTypeDto,
  ) {
    return this.fuelTypeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un type de carburant (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du type de carburant' })
  @ApiResponse({ status: 200, description: 'Type de carburant désactivé' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - SUPER_ADMIN uniquement',
  })
  @ApiResponse({ status: 404, description: 'Type de carburant non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.fuelTypeService.remove(id);
    return { message: 'Type de carburant désactivé avec succès' };
  }
}
