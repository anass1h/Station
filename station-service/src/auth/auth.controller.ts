import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginBadgeDto,
  RegisterDto,
  AuthResponseDto,
  AuthUserDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ChangePinDto,
} from './dto';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import type { AuthenticatedUser } from './strategies';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket: { remoteAddress?: string };
}

@ApiTags('auth')
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

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({
    summary: 'Connexion par email/password',
    description: 'Pour GESTIONNAIRE et SUPER_ADMIN uniquement. Retourne access token et refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Connexion réussie avec tokens' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @ApiOperation({
    summary: 'Connexion par badge/PIN',
    description: 'Pour POMPISTE et GESTIONNAIRE uniquement. Retourne access token et refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Connexion réussie avec tokens' })
  @ApiResponse({ status: 401, description: 'Badge ou PIN invalide' })
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tentatives par minute
  @ApiOperation({
    summary: 'Rafraîchir les tokens',
    description: 'Utilise le refresh token pour obtenir de nouveaux tokens. Le refresh token est à usage unique (rotation).',
  })
  @ApiResponse({ status: 200, description: 'Nouveaux tokens générés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide, expiré ou révoqué' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives de rafraîchissement' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @ApiOperation({ summary: 'Inscription nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec tokens' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email ou badge déjà utilisé' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives d\'inscription' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion de tous les appareils',
    description: 'Révoque tous les refresh tokens de l\'utilisateur',
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.authService.getUserProfile(user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: 'Permet à l\'utilisateur de changer son mot de passe. Révoque tous les tokens.',
  })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié avec succès' })
  @ApiResponse({ status: 400, description: 'Mot de passe invalide ou compte sans mot de passe' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le code PIN',
    description: 'Permet à l\'utilisateur (POMPISTE/GESTIONNAIRE) de changer son code PIN. Révoque tous les tokens.',
  })
  @ApiResponse({ status: 200, description: 'Code PIN modifié avec succès' })
  @ApiResponse({ status: 400, description: 'PIN invalide ou utilisateur non autorisé' })
  async changePin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePinDto,
  ): Promise<{ message: string }> {
    return this.authService.changePin(user.id, dto.newPin);
  }
}
