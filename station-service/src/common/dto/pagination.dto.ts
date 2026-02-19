import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_CONSTANTS } from '../constants/index.js';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Numéro de page',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: PAGINATION_CONSTANTS.MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_CONSTANTS.MAX_PAGE_SIZE)
  perPage?: number = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Champ de tri', default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'id', 'amount', 'status', 'email', 'firstName', 'lastName', 'code', 'reference'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
