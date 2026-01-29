import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
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
import { CashRegisterService } from './cash-register.service.js';
import { CloseCashRegisterDto } from './dto/index.js';

@ApiTags('cash-registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-registers')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('close')
  @Roles(UserRole.POMPISTE, UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clôturer une caisse' })
  @ApiResponse({ status: 201, description: 'Caisse clôturée avec succès' })
  @ApiResponse({ status: 400, description: 'Shift non clôturé ou déjà validé' })
  @ApiResponse({ status: 404, description: 'Shift non trouvé' })
  @ApiResponse({ status: 409, description: 'Clôture déjà existante pour ce shift' })
  async close(
    @Body() dto: CloseCashRegisterDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.cashRegisterService.close(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les clôtures de caisse' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiResponse({ status: 200, description: 'Liste des clôtures de caisse' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.cashRegisterService.findAll({
      stationId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('variances')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Récupérer les clôtures avec écarts significatifs' })
  @ApiQuery({ name: 'stationId', required: true, description: 'ID de la station' })
  @ApiQuery({ name: 'minVariance', required: false, description: 'Écart minimum (valeur absolue)' })
  @ApiResponse({ status: 200, description: 'Liste des clôtures avec écarts' })
  async findWithVariance(
    @Query('stationId') stationId: string,
    @Query('minVariance') minVariance?: string,
  ) {
    return this.cashRegisterService.findWithVariance(
      stationId,
      minVariance ? parseFloat(minVariance) : undefined,
    );
  }

  @Get('shift/:shiftId')
  @ApiOperation({ summary: 'Récupérer la clôture d\'un shift' })
  @ApiParam({ name: 'shiftId', description: 'UUID du shift' })
  @ApiResponse({ status: 200, description: 'Clôture de caisse du shift' })
  async findByShift(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.cashRegisterService.findByShift(shiftId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une clôture de caisse par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la clôture de caisse' })
  @ApiResponse({ status: 200, description: 'Clôture de caisse trouvée avec ses relations' })
  @ApiResponse({ status: 404, description: 'Clôture de caisse non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.findOne(id);
  }
}
