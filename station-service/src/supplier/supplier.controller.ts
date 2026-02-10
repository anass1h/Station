import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { SupplierService } from './supplier.service.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/index.js';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
  @ApiResponse({ status: 201, description: 'Fournisseur créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les fournisseurs actifs' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs' })
  async findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fournisseur par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur trouvé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver un fournisseur (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur désactivé' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - SUPER_ADMIN uniquement',
  })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.supplierService.remove(id);
    return { message: 'Fournisseur désactivé avec succès' };
  }
}
