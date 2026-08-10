import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { Session } from '../../entities/session.entity'
import { User } from '../../entities/user.entity'
import { UserPreference } from '../../entities/user-preference.entity'
import type { AuthUserPayload, AuthUserView } from '../auth/interfaces/auth-user.interface'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UpdateSecurityDto } from './dto/update-security.dto'

/** 通知偏好视图。 */
export interface PreferencesView {
  notifySecurity: boolean
  notifyInvite: boolean
  notifyWeekly: boolean
}

/** 安全开关视图。 */
export interface SecurityView {
  mfaEnabled: boolean
  idleLogout: boolean
}

/** 活动会话列表项。 */
export interface SessionItemView {
  id: string
  label: string
  ip: string | null
  isCurrent: boolean
  createdAt: string
}

/**
 * 当前用户资料 / 偏好 / 安全 / 会话。
 */
@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPreference)
    private readonly preferenceRepo: Repository<UserPreference>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  /**
   * 更新个人资料。
   */
  async updateProfile(
    authUser: AuthUserPayload,
    dto: UpdateProfileDto,
  ): Promise<AuthUserView> {
    const user = await this.requireUser(authUser.id)
    const email = dto.email.trim().toLowerCase()

    if (email !== user.email) {
      const exists = await this.userRepo.findOne({ where: { email } })
      if (exists && String(exists.id) !== String(user.id)) {
        throw new ConflictException('该邮箱已被注册')
      }
    }

    user.name = dto.name.trim()
    user.title = dto.title.trim()
    user.email = email
    if (dto.bio !== undefined) {
      user.bio = dto.bio.length ? dto.bio : null
    }
    await this.userRepo.save(user)

    return this.toUserView(user, authUser.organizationName)
  }

  /**
   * 读取通知偏好（不存在则懒创建默认值）。
   */
  async getPreferences(userId: string): Promise<PreferencesView> {
    const pref = await this.ensurePreferences(userId)
    return this.toPreferencesView(pref)
  }

  /**
   * 更新通知偏好。
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<PreferencesView> {
    if (
      dto.notifySecurity === undefined &&
      dto.notifyInvite === undefined &&
      dto.notifyWeekly === undefined
    ) {
      throw new BadRequestException('请至少提供一项通知偏好')
    }

    const pref = await this.ensurePreferences(userId)
    if (dto.notifySecurity !== undefined) {
      pref.notifySecurity = dto.notifySecurity
    }
    if (dto.notifyInvite !== undefined) {
      pref.notifyInvite = dto.notifyInvite
    }
    if (dto.notifyWeekly !== undefined) {
      pref.notifyWeekly = dto.notifyWeekly
    }
    await this.preferenceRepo.save(pref)
    return this.toPreferencesView(pref)
  }

  /**
   * 更新 MFA / 空闲退出开关。
   */
  async updateSecurity(
    userId: string,
    dto: UpdateSecurityDto,
  ): Promise<SecurityView> {
    if (dto.mfaEnabled === undefined && dto.idleLogout === undefined) {
      throw new BadRequestException('请至少提供一项安全设置')
    }

    const user = await this.requireUser(userId)
    if (dto.mfaEnabled !== undefined) {
      user.mfaEnabled = dto.mfaEnabled
    }
    if (dto.idleLogout !== undefined) {
      user.idleLogout = dto.idleLogout
    }
    await this.userRepo.save(user)
    return {
      mfaEnabled: user.mfaEnabled,
      idleLogout: user.idleLogout,
    }
  }

  /**
   * 修改密码并吊销全部会话（强制重新登录）。
   */
  async changePassword(
    authUser: AuthUserPayload,
    dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    const user = await this.requireUser(authUser.id)

    if (!user.passwordHash) {
      throw new BadRequestException('该账号尚未设置密码，无法修改')
    }

    const matched = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    )
    if (!matched) {
      throw new BadRequestException('当前密码不正确')
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('新密码不能与当前密码相同')
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.userRepo.save(user)

    await this.sessionRepo
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId: user.id })
      .andWhere('revoked_at IS NULL')
      .execute()

    return { ok: true }
  }

  /**
   * 列出未吊销且未过期的活动会话。
   */
  async listSessions(
    authUser: AuthUserPayload,
  ): Promise<{ items: SessionItemView[] }> {
    const sessions = await this.sessionRepo.find({
      where: {
        userId: authUser.id,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    })

    const items = sessions.map((session) => {
      const isCurrent = session.tokenJti === authUser.jti
      return {
        id: String(session.id),
        label: parseUserAgentLabel(session.userAgent),
        ip: session.ip,
        isCurrent,
        createdAt: session.createdAt.toISOString(),
      }
    })

    return { items }
  }

  /**
   * 撤销非当前会话。
   */
  async revokeSession(
    authUser: AuthUserPayload,
    sessionId: string,
  ): Promise<{ ok: true }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId: authUser.id },
    })
    if (!session || session.revokedAt) {
      throw new NotFoundException('会话不存在')
    }
    if (session.tokenJti === authUser.jti) {
      throw new BadRequestException('不能撤销当前会话')
    }

    session.revokedAt = new Date()
    await this.sessionRepo.save(session)
    return { ok: true }
  }

  /**
   * 确保偏好行存在。
   */
  private async ensurePreferences(userId: string): Promise<UserPreference> {
    let pref = await this.preferenceRepo.findOne({ where: { userId } })
    if (pref) return pref

    pref = this.preferenceRepo.create({
      userId,
      notifySecurity: true,
      notifyInvite: true,
      notifyWeekly: false,
    })
    return this.preferenceRepo.save(pref)
  }

  /**
   * 加载用户，不存在则 404。
   */
  private async requireUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { organization: true },
    })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }

  /**
   * Entity → AuthUserView。
   */
  private toUserView(user: User, organizationName?: string): AuthUserView {
    return {
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
        name: organizationName ?? user.organization?.name ?? '',
      },
    }
  }

  /**
   * Preference → 视图。
   */
  private toPreferencesView(pref: UserPreference): PreferencesView {
    return {
      notifySecurity: pref.notifySecurity,
      notifyInvite: pref.notifyInvite,
      notifyWeekly: pref.notifyWeekly,
    }
  }
}

/**
 * 由 User-Agent 解析「浏览器 · 系统」标签。
 */
export function parseUserAgentLabel(ua: string | null): string {
  if (!ua) return '未知设备'

  let browser = '未知浏览器'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'

  let os = '未知系统'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iPhone'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  return `${browser} · ${os}`
}
