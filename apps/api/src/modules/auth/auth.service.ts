import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { DataSource, Repository } from 'typeorm'
import { Organization } from '../../entities/organization.entity'
import { Session } from '../../entities/session.entity'
import { User } from '../../entities/user.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import {
  AuthTokenResponse,
  AuthUserPayload,
  AuthUserView,
} from './interfaces/auth-user.interface'

/**
 * 注册 / 登录 / 会话签发与吊销。
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  /**
   * 注册：创建组织 + admin 用户 + 会话。
   */
  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ip?: string },
  ): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase()
    const exists = await this.userRepo.findOne({ where: { email } })
    if (exists) {
      throw new ConflictException('该邮箱已被注册')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const slug = await this.uniqueSlug(dto.orgName)

    const result = await this.dataSource.transaction(async (manager) => {
      const org = manager.create(Organization, {
        name: dto.orgName.trim(),
        slug,
      })
      await manager.save(org)

      const user = manager.create(User, {
        organizationId: org.id,
        email,
        passwordHash,
        name: dto.name.trim(),
        role: 'admin',
        status: 'active',
        title: null,
        bio: null,
      })
      await manager.save(user)
      user.organization = org
      return user
    })

    return this.issueToken(result, false, meta)
  }

  /**
   * 登录并签发 token。
   */
  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ip?: string },
  ): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase()
    const user = await this.userRepo.findOne({
      where: { email },
      relations: { organization: true },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    if (user.status === 'disabled') {
      throw new ForbiddenException(
        '该账号已被停用，请联系工作区管理员。',
      )
    }
    if (user.status === 'invited') {
      throw new ForbiddenException('邀请尚未激活，请联系工作区管理员。')
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('邮箱或密码不正确')
    }

    return this.issueToken(user, Boolean(dto.remember), meta)
  }

  /**
   * 吊销当前会话。
   */
  async logout(user: AuthUserPayload): Promise<{ ok: true }> {
    await this.sessionRepo
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('token_jti = :jti', { jti: user.jti })
      .andWhere('revoked_at IS NULL')
      .execute()
    return { ok: true }
  }

  /**
   * 当前用户摘要（从 DB 重读，含资料与安全字段）。
   */
  async me(user: AuthUserPayload): Promise<AuthUserView> {
    const entity = await this.userRepo.findOne({
      where: { id: user.id },
      relations: { organization: true },
    })
    if (!entity) {
      throw new UnauthorizedException('未登录或登录已失效')
    }
    return {
      id: String(entity.id),
      name: entity.name,
      email: entity.email,
      role: entity.role,
      status: entity.status,
      title: entity.title,
      bio: entity.bio,
      mfaEnabled: entity.mfaEnabled,
      idleLogout: entity.idleLogout,
      organization: {
        id: String(entity.organizationId),
        name: entity.organization?.name ?? user.organizationName,
      },
    }
  }

  /**
   * 签发 JWT 并写入 Session。
   */
  private async issueToken(
    user: User,
    remember: boolean,
    meta: { userAgent?: string; ip?: string },
  ): Promise<AuthTokenResponse> {
    const expiresIn = this.resolveExpiresIn(remember)
    const expiresInSeconds = this.parseDurationToSeconds(expiresIn)
    const jti = randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

    const session = this.sessionRepo.create({
      userId: user.id,
      tokenJti: jti,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
      ip: meta.ip?.slice(0, 64) ?? null,
      expiresAt,
      revokedAt: null,
    })
    await this.sessionRepo.save(session)

    user.lastLoginAt = new Date()
    await this.userRepo.save(user)

    const accessToken = await this.jwtService.signAsync(
      {
        sub: String(user.id),
        org: String(user.organizationId),
        role: user.role,
        jti,
      },
      { expiresIn: expiresIn as `${number}d` },
    )

    const orgName =
      user.organization?.name ??
      (
        await this.orgRepo.findOne({ where: { id: user.organizationId } })
      )?.name ??
      ''

    return {
      accessToken,
      expiresIn: expiresInSeconds,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        bio: user.bio,
        mfaEnabled: user.mfaEnabled,
        idleLogout: user.idleLogout,
        organization: {
          id: String(user.organizationId),
          name: orgName,
        },
      },
    }
  }

  /**
   * @param remember 是否记住登录
   */
  private resolveExpiresIn(remember: boolean): string {
    if (remember) {
      return this.config.get<string>('JWT_REMEMBER_EXPIRES_IN', '14d')
    }
    return this.config.get<string>('JWT_EXPIRES_IN', '1d')
  }

  /**
   * 将 `1d` / `14d` / `3600` 转为秒。
   */
  private parseDurationToSeconds(value: string): number {
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }
    const match = /^(\d+)([smhd])$/i.exec(trimmed)
    if (!match) {
      return 86400
    }
    const amount = Number(match[1])
    const unit = match[2].toLowerCase()
    const map: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    }
    return amount * (map[unit] ?? 86400)
  }

  /**
   * 由组织名生成唯一 slug。
   */
  private async uniqueSlug(name: string): Promise<string> {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'workspace'

    let candidate = base
    let i = 0
    while (await this.orgRepo.findOne({ where: { slug: candidate } })) {
      i += 1
      candidate = `${base}-${i}`
    }
    return candidate
  }
}
