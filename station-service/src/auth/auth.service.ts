import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { RATE_LIMIT_CONSTANTS } from '../common/constants/index.js';
import {
  RegisterDto,
  AuthResponseDto,
  AuthUserDto,
  LoginBadgeDto,
  SetupAdminDto,
} from './dto';
import type { AuthenticatedUser } from './strategies/index.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRES_IN: number; // seconds
  private readonly REFRESH_TOKEN_EXPIRES_DAYS: number;

  // Hash factice pour prévenir les timing attacks
  // Même nombre de rounds que les vrais hash pour un temps de comparaison identique
  private readonly DUMMY_HASH =
    '$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

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
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 60 * 60;
      case 'd':
        return num * 60 * 60 * 24;
      default:
        return 900;
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

  // ═══════════════════════════════════════════════════════════════
  // VERROUILLAGE DE COMPTE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Vérifie si le compte est verrouillé.
   * Lance UnauthorizedException si verrouillé.
   */
  private async checkAccountLock(user: User): Promise<void> {
    if (!user.lockedUntil) return;

    if (user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Compte verrouillé. Réessayez dans ${remainingMinutes} minute(s).`,
      );
    }

    // Lock expiré → réinitialiser
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  /**
   * Incrémente le compteur d'échecs et verrouille si nécessaire.
   */
  private async handleFailedLogin(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: attempts,
    };

    if (attempts >= RATE_LIMIT_CONSTANTS.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(
        lockUntil.getMinutes() + RATE_LIMIT_CONSTANTS.LOCK_DURATION_MINUTES,
      );
      updateData.lockedUntil = lockUntil;

      this.logger.warn(
        `Compte ${user.email || user.badgeCode} verrouillé après ${attempts} tentatives échouées (IP: ${ipAddress})`,
      );

      // Audit : verrouillage
      await this.auditLogService.log({
        userId: user.id,
        action: 'ACCOUNT_LOCKED',
        entityType: 'User',
        entityId: user.id,
        newValue: {
          reason: `${attempts} tentatives échouées`,
          lockedUntil: updateData.lockedUntil.toISOString(),
        },
        ipAddress,
        userAgent,
        stationId: user.stationId ?? undefined,
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  /**
   * Réinitialise le compteur d'échecs après un login réussi.
   */
  private async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION UTILISATEUR
  // ═══════════════════════════════════════════════════════════════

  async validateUser(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User | null> {
    email = email.toLowerCase().trim(); // NORMALISATION
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // ═══ TIMING ATTACK PREVENTION ═══
      // Effectuer une comparaison factice pour que le temps de réponse
      // soit identique que l'utilisateur existe ou non
      await bcrypt.compare(password, this.DUMMY_HASH);
      return null;
    }

    // POMPISTE ne peut pas se connecter par email
    if (user.role === UserRole.POMPISTE) {
      await bcrypt.compare(password, this.DUMMY_HASH);
      return null;
    }

    // Vérifier si le compte est actif (timing attack prevention)
    if (!user.isActive) {
      await bcrypt.compare(password, this.DUMMY_HASH);
      throw new UnauthorizedException('Compte désactivé');
    }

    // Vérifier le verrouillage
    await this.checkAccountLock(user);

    const isPasswordValid = await this.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Incrémenter les échecs
      await this.handleFailedLogin(user, ipAddress, userAgent);
      return null;
    }

    // Réinitialiser le compteur si succès
    if (user.failedLoginAttempts > 0) {
      await this.resetFailedAttempts(user.id);
    }

    return user;
  }

  async validateByBadge(
    badgeCode: string,
    pinCode: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { badgeCode },
    });

    if (!user) {
      // ═══ TIMING ATTACK PREVENTION ═══
      await bcrypt.compare(pinCode, this.DUMMY_HASH);
      return null;
    }

    // Seuls POMPISTE et GESTIONNAIRE peuvent se connecter par badge
    if (user.role === UserRole.SUPER_ADMIN) {
      await bcrypt.compare(pinCode, this.DUMMY_HASH);
      return null;
    }

    if (!user.pinCodeHash) {
      await bcrypt.compare(pinCode, this.DUMMY_HASH);
      return null;
    }

    // Vérifier si le compte est actif (timing attack prevention)
    if (!user.isActive) {
      await bcrypt.compare(pinCode, this.DUMMY_HASH);
      throw new UnauthorizedException('Compte désactivé');
    }

    // Vérifier le verrouillage
    await this.checkAccountLock(user);

    const isPinValid = await this.comparePasswords(pinCode, user.pinCodeHash);

    if (!isPinValid) {
      // Incrémenter les échecs
      await this.handleFailedLogin(user, ipAddress, userAgent);
      return null;
    }

    // Réinitialiser le compteur si succès
    if (user.failedLoginAttempts > 0) {
      await this.resetFailedAttempts(user.id);
    }

    return user;
  }

  // ═══════════════════════════════════════════════════════════════
  // GESTION DES TOKENS
  // ═══════════════════════════════════════════════════════════════

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
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
      this.logger.warn(
        `Possible token reuse attack detected for user ${storedToken.userId}`,
      );
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

    this.logger.log(
      `Revoked ${result.count} refresh tokens for user ${userId}`,
    );
    return result.count;
  }

  async cleanExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });

    this.logger.log(`Cleaned ${result.count} expired/revoked refresh tokens`);
    return result.count;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════

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
    const user = await this.validateByBadge(
      dto.badgeCode,
      dto.pinCode,
      ipAddress,
      userAgent,
    );

    if (!user) {
      // Log failed login attempt
      await this.auditLogService.logLoginFailed(
        dto.badgeCode,
        ipAddress,
        userAgent,
      );
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
    email = email.toLowerCase().trim(); // NORMALISATION
    const user = await this.validateUser(email, password, ipAddress, userAgent);

    if (!user) {
      // Log failed login attempt
      await this.auditLogService.logLoginFailed(email, ipAddress, userAgent);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.login(user, ipAddress, userAgent);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════

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

    await this.auditLogService.logLogout(
      userId,
      ipAddress,
      userAgent,
      stationId,
    );
  }

  async logoutAll(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    stationId?: string,
  ): Promise<number> {
    const count = await this.revokeAllUserTokens(userId);
    await this.auditLogService.logLogout(
      userId,
      ipAddress,
      userAgent,
      stationId,
    );
    return count;
  }

  // ═══════════════════════════════════════════════════════════════
  // SETUP FIRST ADMIN (Endpoint public pour initialisation)
  // ═══════════════════════════════════════════════════════════════

  async setupFirstAdmin(
    dto: SetupAdminDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Normalization de l'email
    if (dto.email) {
      dto.email = dto.email.toLowerCase().trim();
    }
    // 1. Vérifier qu'aucun SUPER_ADMIN n'existe
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingAdmin) {
      throw new ForbiddenException(
        'Un administrateur existe déjà. Utilisez /auth/register avec un compte authentifié.',
      );
    }

    // 2. Vérifier unicité email
    await this.checkUniqueConstraints(dto.email, null);

    // 3. Créer le SUPER_ADMIN
    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.SUPER_ADMIN,
      },
    });

    // 4. Audit log
    await this.auditLogService.log({
      userId: user.id,
      action: 'SYSTEM_SETUP',
      entityType: 'User',
      entityId: user.id,
      newValue: { message: 'Premier SUPER_ADMIN créé via /auth/setup' },
      ipAddress,
      userAgent,
    });

    this.logger.warn(
      `Premier SUPER_ADMIN créé : ${dto.email} depuis ${ipAddress}`,
    );

    return this.login(user, ipAddress, userAgent);
  }

  // ═══════════════════════════════════════════════════════════════
  // REGISTER (Protégé par JWT + Rôles)
  // ═══════════════════════════════════════════════════════════════

  async register(
    dto: RegisterDto,
    currentUser: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // ═══ Contrôle d'autorisation par rôle ═══
      if (dto.email) {
    dto.email = dto.email.toLowerCase().trim();
    }
    if (currentUser.role === UserRole.GESTIONNAIRE) {
      // GESTIONNAIRE ne peut créer que des POMPISTES
      if (dto.role !== UserRole.POMPISTE) {
        throw new ForbiddenException(
          'Un gestionnaire ne peut créer que des comptes POMPISTE',
        );
      }
      // GESTIONNAIRE ne peut créer que pour SA station
      if (!currentUser.stationId) {
        throw new ForbiddenException('Gestionnaire sans station assignée');
      }
      // Forcer le stationId du gestionnaire (ignore ce que le client envoie)
      dto.stationId = currentUser.stationId;
    }

    // SUPER_ADMIN peut tout créer — aucune restriction
    // (POMPISTE n'a pas accès à cet endpoint grâce au RolesGuard)

    // ═══ Vérifier que la station existe et est active ═══
    if (dto.stationId) {
      const station = await this.prisma.station.findUnique({
        where: { id: dto.stationId },
      });
      if (!station) {
        throw new NotFoundException(`Station ${dto.stationId} introuvable`);
      }
      if (!station.isActive) {
        throw new BadRequestException(
          `La station ${station.name} est désactivée`,
        );
      }
    }

    // ═══ Dispatch par rôle ═══
    let user: User;
    if (dto.role === UserRole.POMPISTE) {
      user = await this.createPompiste(dto);
    } else if (dto.role === UserRole.GESTIONNAIRE) {
      user = await this.createGestionnaire(dto);
    } else {
      user = await this.createSuperAdmin(dto);
    }

    // Audit log
    await this.auditLogService.log({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      newValue: {
        createdUser: {
          email: user.email,
          role: user.role,
          stationId: user.stationId,
        },
      },
      ipAddress,
      userAgent,
      stationId: currentUser.stationId ?? undefined,
    });

    return this.login(user, ipAddress, userAgent);
  }

  private async createPompiste(dto: RegisterDto): Promise<User> {
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

    return this.prisma.user.create({
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
  }

  private async createGestionnaire(dto: RegisterDto): Promise<User> {
    const hasEmailAuth = dto.email && dto.password;
    const hasBadgeAuth = dto.badgeCode && dto.pinCode;

    if (!hasEmailAuth && !hasBadgeAuth) {
      throw new BadRequestException(
        "Au moins une méthode d'authentification requise: (email + password) ou (badgeCode + pinCode)",
      );
    }

    await this.checkUniqueConstraints(dto.email, dto.badgeCode);

    const passwordHash = dto.password
      ? await this.hashPassword(dto.password)
      : null;
    const pinCodeHash = dto.pinCode
      ? await this.hashPinCode(dto.pinCode)
      : null;

    return this.prisma.user.create({
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
  }

  private async createSuperAdmin(dto: RegisterDto): Promise<User> {
    if (!dto.email || !dto.password) {
      throw new BadRequestException(
        'email et password sont obligatoires pour un super admin',
      );
    }

    await this.checkUniqueConstraints(dto.email, null);

    const passwordHash = await this.hashPassword(dto.password);

    return this.prisma.user.create({
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
  }

  private async checkUniqueConstraints(
    email?: string,
    badgeCode?: string | null,
  ): Promise<void> {
    if (email) {
      email = email.toLowerCase().trim(); // NORMALISATION
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
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

  // ═══════════════════════════════════════════════════════════════
  // PROFIL & CHANGEMENT CREDENTIALS
  // ═══════════════════════════════════════════════════════════════

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
      throw new BadRequestException(
        "Ce compte n'a pas de mot de passe configuré",
      );
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

  async changePin(
    userId: string,
    currentPin: string,
    newPin: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Only POMPISTE and GESTIONNAIRE can have PIN
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        "Les super admins n'utilisent pas de code PIN",
      );
    }

    if (!user.pinCodeHash) {
      throw new BadRequestException('Aucun code PIN configuré pour ce compte');
    }

    // Vérifier l'ancien PIN
    const isPinValid = await this.comparePasswords(currentPin, user.pinCodeHash);
    if (!isPinValid) {
      throw new UnauthorizedException('Code PIN actuel incorrect');
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

  // ═══════════════════════════════════════════════════════════════
  // DÉVERROUILLAGE DE COMPTE (Admin)
  // ═══════════════════════════════════════════════════════════════

  async unlockAccount(
    userId: string,
    currentUser: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // GESTIONNAIRE ne peut déverrouiller que les utilisateurs de sa station
    if (
      currentUser.role === UserRole.GESTIONNAIRE &&
      user.stationId !== currentUser.stationId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez déverrouiller que les utilisateurs de votre station',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    this.logger.log(
      `Compte ${user.email || user.badgeCode} déverrouillé par ${currentUser.email || currentUser.id}`,
    );

    await this.auditLogService.log({
      userId: currentUser.id,
      action: 'ACCOUNT_UNLOCKED',
      entityType: 'User',
      entityId: userId,
      newValue: {
        unlockedUser: user.email || user.badgeCode,
      },
      stationId: currentUser.stationId ?? undefined,
    });

    return {
      message: `Compte de ${user.firstName} ${user.lastName} déverrouillé`,
    };
  }
}
