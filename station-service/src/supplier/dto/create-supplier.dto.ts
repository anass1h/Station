import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Nom du fournisseur',
    example: 'Afriquia SMDC',
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({
    description: 'Nom du contact',
    example: 'Mohammed Alami',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+212 522 123456',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contact',
    example: 'contact@afriquia.ma',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Adresse du fournisseur',
    example: '123 Zone Industrielle, Casablanca',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
