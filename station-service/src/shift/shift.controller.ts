import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { ShiftStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles, CurrentUser } from '../auth/decorators/index.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { ShiftService } from './shift.service.js';
import { StartShiftDto, EndShiftDto, ValidateShiftDto } from './dto/index.js';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post('start')
  @Roles(UserRole.POMPISTE, UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Démarrer un nouveau shift' })
  @ApiResponse({ status: 201, description: 'Shift démarré avec succès' })
  @ApiResponse({ status: 400, description: 'Index de début invalide' })
  @ApiResponse({ status: 404, description: 'Pistolet non trouvé' })
  @ApiResponse({ status: 409, description: 'Un shift est déjà ouvert sur ce pistolet' })
  async startShift(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartShiftDto,
  ) {
    return this.shiftService.startShift(user.id, dto);
  }

  @Post(':id/end')
  @Roles(UserRole.POMPISTE, UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clôturer un shift' })
  @ApiParam({ name: 'id', description: 'UUID du shift' })
  @ApiResponse({ status: 200, description: 'Shift clôturé avec succès' })
  @ApiResponse({ status: 400, description: 'Shift non ouvert ou index invalide' })
  @ApiResponse({ status: 403, description: 'Non autorisé à clôturer ce shift' })
  @ApiResponse({ status: 404, description: 'Shift non trouvé' })
  async endShift(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EndShiftDto,
  ) {
    return this.shiftService.endShift(id, user.id, user.role, dto);
  }

  @Post(':id/validate')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Valider un shift clôturé' })
  @ApiParam({ name: 'id', description: 'UUID du shift' })
  @ApiResponse({ status: 200, description: 'Shift validé avec succès' })
  @ApiResponse({ status: 400, description: 'Le shift doit être clôturé pour être validé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Shift non trouvé' })
  async validateShift(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() _dto: ValidateShiftDto,
  ) {
    return this.shiftService.validateShift(id, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les shifts avec filtres' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiQuery({ name: 'pompisteId', required: false, description: 'Filtrer par pompiste' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ShiftStatus,
    description: 'Filtrer par status',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiResponse({ status: 200, description: 'Liste des shifts' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('pompisteId') pompisteId?: string,
    @Query('status') status?: ShiftStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.shiftService.findAll({
      stationId,
      pompisteId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('open')
  @ApiOperation({ summary: 'Récupérer tous les shifts ouverts' })
  @ApiQuery({ name: 'stationId', required: false, description: 'Filtrer par station' })
  @ApiResponse({ status: 200, description: 'Liste des shifts ouverts' })
  async findOpenShifts(@Query('stationId') stationId?: string) {
    return this.shiftService.findOpenShifts(stationId);
  }

  @Get('by-pompiste/:pompisteId')
  @ApiOperation({ summary: 'Récupérer les shifts d\'un pompiste' })
  @ApiParam({ name: 'pompisteId', description: 'UUID du pompiste' })
  @ApiResponse({ status: 200, description: 'Liste des shifts du pompiste' })
  async findByPompiste(@Param('pompisteId', ParseUUIDPipe) pompisteId: string) {
    return this.shiftService.findByPompiste(pompisteId);
  }

  @Get('by-nozzle/:nozzleId')
  @ApiOperation({ summary: 'Récupérer l\'historique des shifts d\'un pistolet' })
  @ApiParam({ name: 'nozzleId', description: 'UUID du pistolet' })
  @ApiResponse({ status: 200, description: 'Historique des shifts du pistolet' })
  async findByNozzle(@Param('nozzleId', ParseUUIDPipe) nozzleId: string) {
    return this.shiftService.findByNozzle(nozzleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un shift par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du shift' })
  @ApiResponse({ status: 200, description: 'Shift trouvé avec ses relations' })
  @ApiResponse({ status: 404, description: 'Shift non trouvé' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.findOne(id);
  }
}
