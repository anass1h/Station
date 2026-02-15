import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';
import { Transform } from 'class-transformer';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
}

export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: 'Filtrer par station' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par utilisateur' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: "Filtrer par type d'entité" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @NoHtml()
  entityType?: string;

  @ApiPropertyOptional({ description: "Filtrer par ID d'entité" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityId?: string;

  @ApiPropertyOptional({ enum: AuditAction, description: 'Filtrer par action' })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Date de début (ISO format)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO format)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
