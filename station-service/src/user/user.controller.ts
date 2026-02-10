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
import { Roles } from '../auth/decorators/index.js';
import { UserService } from './user.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/index.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  @ApiQuery({
    name: 'stationId',
    required: false,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filtrer par role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut actif',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  async findAll(
    @Query('stationId') stationId?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    return this.userService.findAll({
      stationId,
      role,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Recuperer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Utilisateur trouve' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouve' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Creer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur cree' })
  @ApiResponse({ status: 400, description: 'Donnees invalides' })
  @ApiResponse({ status: 409, description: 'Email ou badge deja utilise' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Utilisateur modifie' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouve' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Utilisateur supprime' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouve' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/reset-pin')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Reinitialiser le PIN d'un utilisateur" })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'PIN reinitialise' })
  async resetPin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('pin') pin: string,
  ) {
    return this.userService.resetPin(id, pin);
  }
}
