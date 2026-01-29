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
import { DispenserService } from './dispenser.service.js';
import { CreateDispenserDto, UpdateDispenserDto } from './dto/index.js';

@ApiTags('dispensers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispensers')
export class DispenserController {
  constructor(private readonly dispenserService: DispenserService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau distributeur' })
  @ApiResponse({ status: 201, description: 'Distributeur créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  @ApiResponse({ status: 409, description: 'Référence déjà existante dans la station' })
  async create(@Body() dto: CreateDispenserDto) {
    return this.dispenserService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les distributeurs actifs' })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiResponse({ status: 200, description: 'Liste des distributeurs' })
  async findAll(@Query('stationId') stationId?: string) {
    return this.dispenserService.findAll(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un distributeur par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du distributeur' })
  @ApiResponse({ status: 200, description: 'Distributeur trouvé avec ses relations' })
  @ApiResponse({ status: 404, description: 'Distributeur non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispenserService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un distributeur' })
  @ApiParam({ name: 'id', description: 'UUID du distributeur' })
  @ApiResponse({ status: 200, description: 'Distributeur mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Distributeur non trouvé' })
  @ApiResponse({ status: 409, description: 'Référence déjà existante dans la station' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDispenserDto,
  ) {
    return this.dispenserService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un distributeur (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du distributeur' })
  @ApiResponse({ status: 200, description: 'Distributeur désactivé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - SUPER_ADMIN uniquement' })
  @ApiResponse({ status: 404, description: 'Distributeur non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.dispenserService.remove(id);
    return { message: 'Distributeur désactivé avec succès' };
  }
}
