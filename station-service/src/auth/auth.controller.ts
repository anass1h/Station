import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service.js';
import {
  LoginDto,
  LoginBadgeDto,
  RegisterDto,
  AuthResponseDto,
  AuthUserDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ChangePinDto,
  SetupAdminDto,
} from './dto/index.js';
import { CurrentUser, Roles } from './decorators/index.js';
import { Public } from '../common/decorators/index.js';
import { SkipStationScope } from '../common/guards/index.js';
import type { AuthenticatedUser } from './strategies/index.js';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket: { remoteAddress?: string };
}

@ApiTags('auth')
@SkipStationScope()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getIpAddress(request: RequestWithHeaders): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════
  // ENDPOINTS PUBLICS (bypass JwtAuthGuard via @Public())
  // ═══════════════════════════════════════════════════════════════

  @Post('login')
  @HttpCode(200)
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({
    summary: 'Connexion par email/password',
    description:
      'Pour GESTIONNAIRE et SUPER_ADMIN uniquement. Retourne access token et refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Connexion réussie avec tokens' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou compte verrouillé' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives de connexion' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithHeaders,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;

    return this.authService.loginByEmail(
      dto.email,
      dto.password,
      ipAddress,
      userAgent,
    );
  }

  @Post('login-badge')
  @HttpCode(200)
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({
    summary: 'Connexion par badge/PIN',
    description:
      'Pour POMPISTE et GESTIONNAIRE uniquement. Retourne access token et refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Connexion réussie avec tokens' })
  @ApiResponse({ status: 401, description: 'Badge ou PIN invalide ou compte verrouillé' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives de connexion' })
  async loginByBadge(
    @Body() dto: LoginBadgeDto,
    @Req() request: RequestWithHeaders,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;

    return this.authService.loginByBadge(dto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(200)
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tentatives par minute
  @ApiOperation({
    summary: 'Rafraîchir les tokens',
    description:
      'Utilise le refresh token pour obtenir de nouveaux tokens. Le refresh token est à usage unique (rotation).',
  })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens générés' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide, expiré ou révoqué',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives de rafraîchissement',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('setup')
  @Public()
  @Throttle({ default: { limit: 1, ttl: 3600000 } }) // 1 req/heure
  @ApiOperation({
    summary: 'Initialisation du premier administrateur',
    description:
      "Crée le premier SUPER_ADMIN du système. Actif uniquement si aucun SUPER_ADMIN n'existe.",
  })
  @ApiResponse({ status: 201, description: 'Premier administrateur créé' })
  @ApiResponse({ status: 403, description: 'Un administrateur existe déjà' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives' })
  async setup(
    @Body() dto: SetupAdminDto,
    @Req() request: RequestWithHeaders,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;
    return this.authService.setupFirstAdmin(dto, ipAddress, userAgent);
  }

  // ═══════════════════════════════════════════════════════════════
  // ENDPOINTS PROTÉGÉS (JwtAuthGuard via APP_GUARD)
  // ═══════════════════════════════════════════════════════════════

  @Post('register')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GESTIONNAIRE)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
    description:
      'SUPER_ADMIN peut créer tous les rôles. GESTIONNAIRE peut créer uniquement des POMPISTES pour sa station.',
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 409, description: 'Email ou badge déjà utilisé' })
  @ApiResponse({ status: 429, description: "Trop de tentatives d'inscription" })
  async register(
    @Body() dto: RegisterDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: RequestWithHeaders,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;
    return this.authService.register(dto, currentUser, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion',
    description: 'Révoque le refresh token fourni',
  })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
    @Req() request: RequestWithHeaders,
  ): Promise<{ message: string }> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;

    await this.authService.logout(
      user.id,
      dto.refreshToken,
      ipAddress,
      userAgent,
      user.stationId ?? undefined,
    );

    return { message: 'Déconnexion réussie' };
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion de tous les appareils',
    description: "Révoque tous les refresh tokens de l'utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Tous les tokens révoqués' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithHeaders,
  ): Promise<{ message: string; revokedCount: number }> {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] as string | undefined;

    const count = await this.authService.logoutAll(
      user.id,
      ipAddress,
      userAgent,
      user.stationId ?? undefined,
    );

    return {
      message: 'Déconnexion de tous les appareils réussie',
      revokedCount: count,
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.authService.getUserProfile(user.id);
  }

  @Post('change-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description:
      "Permet à l'utilisateur de changer son mot de passe. Révoque tous les tokens.",
  })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Mot de passe invalide ou compte sans mot de passe',
  })
  @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('change-pin')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le code PIN',
    description:
      "Permet à l'utilisateur (POMPISTE/GESTIONNAIRE) de changer son code PIN. Révoque tous les tokens.",
  })
  @ApiResponse({ status: 200, description: 'Code PIN modifié avec succès' })
  @ApiResponse({
    status: 400,
    description: 'PIN invalide ou utilisateur non autorisé',
  })
  @ApiResponse({ status: 401, description: 'Code PIN actuel incorrect' })
  async changePin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePinDto,
  ): Promise<{ message: string }> {
    return this.authService.changePin(user.id, dto.currentPin, dto.newPin);
  }

  // ═══════════════════════════════════════════════════════════════
  // ENDPOINTS ADMIN - GESTION DES COMPTES
  // ═══════════════════════════════════════════════════════════════

  @Post('unlock-account/:userId')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Roles(UserRole.SUPER_ADMIN, UserRole.GESTIONNAIRE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déverrouiller un compte utilisateur',
    description:
      'SUPER_ADMIN peut déverrouiller tout compte. GESTIONNAIRE peut déverrouiller les comptes de sa station.',
  })
  @ApiParam({ name: 'userId', description: "UUID de l'utilisateur à déverrouiller" })
  @ApiResponse({ status: 200, description: 'Compte déverrouillé avec succès' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async unlockAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.authService.unlockAccount(userId, currentUser);
  }
}
