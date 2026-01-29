import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({ description: 'UUID de la station' })
  @IsUUID()
  stationId!: string;

  @ApiProperty({ enum: AlertType, description: 'Type d\'alerte' })
  @IsEnum(AlertType)
  alertType!: AlertType;

  @ApiProperty({ enum: AlertPriority, description: 'Priorité de l\'alerte' })
  @IsEnum(AlertPriority)
  priority!: AlertPriority;

  @ApiProperty({ description: 'Titre de l\'alerte' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Message détaillé de l\'alerte' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité concernée' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Type de l\'entité concernée (Tank, Shift, Client, etc.)' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}
