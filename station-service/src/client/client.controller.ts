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
import { ClientType, UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { StationScope } from '../common/decorators/index.js';
import { ClientService } from './client.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/index.js';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Station non trouvée' })
  async create(@Body() dto: CreateClientDto) {
    return this.clientService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les clients actifs' })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'clientType',
    required: false,
    enum: ClientType,
    description: 'Filtrer par type',
  })
  @ApiResponse({ status: 200, description: 'Liste des clients' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('clientType') clientType?: ClientType,
  ) {
    return this.clientService.findAll(stationId, clientType);
  }

  @Get('over-credit-limit/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clients ayant dépassé leur plafond de crédit' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Liste des clients en dépassement' })
  async getClientsOverCreditLimit(
    @Param('stationId', ParseUUIDPipe) stationId: string,
  ) {
    return this.clientService.getClientsOverCreditLimit(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du client' })
  @ApiResponse({ status: 200, description: 'Client trouvé avec ses relations' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    return this.clientService.findOne(id, stationId);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiParam({ name: 'id', description: 'UUID du client' })
  @ApiResponse({ status: 200, description: 'Client mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @StationScope() stationId: string | null,
  ) {
    return this.clientService.update(id, dto, stationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un client (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du client' })
  @ApiResponse({ status: 200, description: 'Client désactivé' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - SUPER_ADMIN uniquement',
  })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @StationScope() stationId: string | null,
  ) {
    await this.clientService.remove(id, stationId);
    return { message: 'Client désactivé avec succès' };
  }
}
