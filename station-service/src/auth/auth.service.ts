import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma';
import { AuditLogService } from '../audit-log/index.js';
import {
  RegisterDto,
  AuthResponseDto,
  AuthUserDto,
  LoginBadgeDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 10;
  private readonly ACCESS_TOKEN_EXPIRES_IN: number; // seconds
  private readonly REFRESH_TOKEN_EXPIRES_DAYS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {
    // Default: 15 minutes for access token
    this.ACCESS_TOKEN_EXPIRES_IN = this.parseExpiresIn(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );
    // Default: 7 days for refresh token
    this.REFRESH_TOKEN_EXPIRES_DAYS = parseInt(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_DAYS', '7'),
      10,
    );
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 900; // Default 15 minutes
    }
    const num = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 60 * 60;
      case 'd': return num * 60 * 60 * 24;
      default: return 900;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  async hashPinCode(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.BCRYPT_ROUNDS);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    // POMPISTE ne peut pas se connecter par email
    if (user.role === UserRole.POMPISTE) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateByBadge(
    badgeCode: string,
    pinCode: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { badgeCode },
    });

    if (!user) {
      return null;
    }

    // Seuls POMPISTE et GESTIONNAIRE peuvent se connecter par badge
    if (user.role === UserRole.SUPER_ADMIN) {
      return null;
    }

    if (!user.pinCodeHash) {
      return null;
    }

    const isPinValid = await this.comparePasswords(pinCode, user.pinCodeHash);

    if (!isPinValid) {
      return null;
    }

    return user;
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload = {
      sub: user.id,
      email: user.email || user.badgeCode,
      role: user.role,
      stationId: user.stationId,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashToken(refreshToken);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS);

    // Store hashed refresh token in DB
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    const hashedToken = this.hashToken(refreshToken);

    // Find the refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Check if revoked
    if (storedToken.revokedAt) {
      // Possible token reuse attack - revoke all user tokens
      await this.revokeAllUserTokens(storedToken.userId);
      this.logger.warn(`Possible token reuse attack detected for user ${storedToken.userId}`);
      throw new UnauthorizedException('Refresh token révoqué');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Compte utilisateur désactivé');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        stationId: storedToken.user.stationId,
      },
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Revoked ${result.count} refresh tokens for user ${userId}`);
    return result.count;
  }

  async cleanExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Cleaned ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }

  async login(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful login
    await this.auditLogService.logLogin(
      user.id,
      ipAddress,
      userAgent,
      user.stationId ?? undefined,
    );

    // Update lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        stationId: user.stationId,
      },
    };
  }

  async loginByBadge(
    dto: LoginBadgeDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.validateByBadge(dto.badgeCode, dto.pinCode);

    if (!user) {
      // Log failed login attempt
      await this.auditLogService.logLoginFailed(dto.badgeCode, ipAddress, userAgent);
      throw new UnauthorizedException('Badge ou code PIN incorrect');
    }

    return this.login(user, ipAddress, userAgent);
  }

  async loginByEmail(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.validateUser(email, password);

    if (!user) {
      // Log failed login attempt
      await this.auditLogService.logLoginFailed(email, ipAddress, userAgent);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.login(user, ipAddress, userAgent);
  }

  async logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
    stationId?: string,
  ): Promise<void> {
    // Revoke the refresh token if provided
    if (refreshToken) {
      await this.revokeRefreshToken(refreshToken);
    }

    await this.auditLogService.logLogout(userId, ipAddress, userAgent, stationId);
  }

  async logoutAll(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    stationId?: string,
  ): Promise<number> {
    const count = await this.revokeAllUserTokens(userId);
    await this.auditLogService.logLogout(userId, ipAddress, userAgent, stationId);
    return count;
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (dto.role === UserRole.POMPISTE) {
      return this.registerPompiste(dto);
    }
    if (dto.role === UserRole.GESTIONNAIRE) {
      return this.registerGestionnaire(dto);
    }
    return this.registerSuperAdmin(dto);
  }

  private async registerPompiste(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.badgeCode || !dto.pinCode) {
      throw new BadRequestException(
        'badgeCode et pinCode sont obligatoires pour un pompiste',
      );
    }

    if (!dto.stationId) {
      throw new BadRequestException(
        'stationId est obligatoire pour un pompiste',
      );
    }

    await this.checkUniqueConstraints(dto.email, dto.badgeCode);

    const pinCodeHash = await this.hashPinCode(dto.pinCode);
    const passwordHash = dto.password
      ? await this.hashPassword(dto.password)
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email || null,
        passwordHash,
        badgeCode: dto.badgeCode,
        pinCodeHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        stationId: dto.stationId,
        role: dto.role,
      },
    });

    return this.login(user);
  }

  private async registerGestionnaire(
    dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    const hasEmailAuth = dto.email && dto.password;
    const hasBadgeAuth = dto.badgeCode && dto.pinCode;

    if (!hasEmailAuth && !hasBadgeAuth) {
      throw new BadRequestException(
        'Au moins une méthode d\'authentification requise: (email + password) ou (badgeCode + pinCode)',
      );
    }

    await this.checkUniqueConstraints(dto.email, dto.badgeCode);

    const passwordHash = dto.password
      ? await this.hashPassword(dto.password)
      : null;
    const pinCodeHash = dto.pinCode
      ? await this.hashPinCode(dto.pinCode)
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email || null,
        passwordHash,
        badgeCode: dto.badgeCode || null,
        pinCodeHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        stationId: dto.stationId,
        role: dto.role,
      },
    });

    return this.login(user);
  }

  private async registerSuperAdmin(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.email || !dto.password) {
      throw new BadRequestException(
        'email et password sont obligatoires pour un super admin',
      );
    }

    await this.checkUniqueConstraints(dto.email, null);

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        badgeCode: null,
        pinCodeHash: null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        stationId: dto.stationId,
        role: dto.role,
      },
    });

    return this.login(user);
  }

  private async checkUniqueConstraints(
    email?: string,
    badgeCode?: string | null,
  ): Promise<void> {
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    if (badgeCode) {
      const existingBadge = await this.prisma.user.findUnique({
        where: { badgeCode },
      });
      if (existingBadge) {
        throw new ConflictException('Un utilisateur avec ce badge existe déjà');
      }
    }
  }

  async getUserProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        stationId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Ce compte n\'a pas de mot de passe configuré');
    }

    const isPasswordValid = await this.comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens for security
    await this.revokeAllUserTokens(userId);

    return { message: 'Mot de passe modifié avec succès' };
  }

  async changePin(userId: string, newPin: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Only POMPISTE and GESTIONNAIRE can have PIN
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Les super admins n\'utilisent pas de code PIN');
    }

    const newPinHash = await this.hashPinCode(newPin);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pinCodeHash: newPinHash },
    });

    // Revoke all refresh tokens for security
    await this.revokeAllUserTokens(userId);

    return { message: 'Code PIN modifié avec succès' };
  }
}
