import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { AuditLogService } from './audit-log.service.js';
import { QueryAuditLogDto } from './dto/index.js';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lister les logs d\'audit avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des logs d\'audit' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }

  @Get('entity/:type/:id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Historique d\'une entité spécifique' })
  @ApiParam({ name: 'type', description: 'Type d\'entité (Station, Shift, Sale, etc.)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'entité' })
  @ApiResponse({ status: 200, description: 'Historique de l\'entité' })
  async findByEntity(
    @Param('type') entityType: string,
    @Param('id', ParseUUIDPipe) entityId: string,
  ) {
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actions d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'UUID de l\'utilisateur' })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO format)' })
  @ApiResponse({ status: 200, description: 'Liste des actions de l\'utilisateur' })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.findByUser(userId, from, to);
  }
}
