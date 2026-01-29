import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PompisteDebtService } from './pompiste-debt.service';
import { CreateDebtDto, AddDebtPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DebtStatus } from '@prisma/client';

@Controller('pompiste-debts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PompisteDebtController {
  constructor(private readonly pompisteDebtService: PompisteDebtService) {}

  /**
   * Create a new debt
   */
  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateDebtDto, @Request() req: { user: { id: string } }) {
    return this.pompisteDebtService.create(dto, req.user.id);
  }

  /**
   * Add a payment to a debt
   */
  @Post(':id/payment')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async addPayment(
    @Param('id') id: string,
    @Body() dto: AddDebtPaymentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.pompisteDebtService.addPayment(id, dto, req.user.id);
  }

  /**
   * Get debts by pompiste
   */
  @Get('pompiste/:pompisteId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async findByPompiste(
    @Param('pompisteId') pompisteId: string,
    @Query('status') status?: DebtStatus,
  ) {
    return this.pompisteDebtService.findByPompiste(pompisteId, status);
  }

  /**
   * Get debts by station
   */
  @Get('station/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async findByStation(
    @Param('stationId') stationId: string,
    @Query('status') status?: DebtStatus,
  ) {
    return this.pompisteDebtService.findByStation(stationId, status);
  }

  /**
   * Get total debt for a pompiste (accessible by all authenticated users)
   */
  @Get('total/:pompisteId')
  async getTotalDebt(@Param('pompisteId') pompisteId: string) {
    return this.pompisteDebtService.getTotalDebt(pompisteId);
  }

  /**
   * Get debts overview for a station (dashboard)
   */
  @Get('overview/:stationId')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async getDebtsOverview(@Param('stationId') stationId: string) {
    return this.pompisteDebtService.getDebtsOverview(stationId);
  }

  /**
   * Get a single debt by ID
   */
  @Get(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.pompisteDebtService.findOne(id);
  }

  /**
   * Cancel a debt
   */
  @Post(':id/cancel')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.pompisteDebtService.cancel(id, req.user.id, reason);
  }
}
