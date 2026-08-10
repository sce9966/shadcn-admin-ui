import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { Session } from '../../entities/session.entity'
import { User } from '../../entities/user.entity'
import type { AuthUserPayload } from '../auth/interfaces/auth-user.interface'
import { InviteUserDto } from './dto/invite-user.dto'
import { ListUsersQueryDto } from './dto/list-users.query.dto'
import { UpdateUserStatusDto } from './dto/update-user-status.dto'
import type {
  ResendInviteResult,
  UserListItem,
  UserListPage,
} from './interfaces/user-list.interface'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * 工作区成员管理。
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  /**
   * 分页列表（仅当前组织）。
   */
  async list(
    actor: AuthUserPayload,
    query: ListUsersQueryDto,
  ): Promise<UserListPage> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10

    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.organization_id = :orgId', { orgId: actor.organizationId })

    if (query.keyword) {
      qb.andWhere('(u.name LIKE :kw OR u.email LIKE :kw)', {
        kw: `%${query.keyword}%`,
      })
    }
    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role })
    }
    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status })
    }

    qb.orderBy('u.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    const [rows, total] = await qb.getManyAndCount()

    return {
      items: rows.map((u) => this.toListItem(u)),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 邀请成员（创建 invited 用户）。
   */
  async invite(
    actor: AuthUserPayload,
    dto: InviteUserDto,
  ): Promise<UserListItem> {
    const email = dto.email.trim().toLowerCase()
    const exists = await this.userRepo.findOne({ where: { email } })
    if (exists) {
      if (String(exists.organizationId) === String(actor.organizationId)) {
        throw new ConflictException('该邮箱已在工作区中')
      }
      throw new ConflictException('该邮箱已被注册')
    }

    const local = email.split('@')[0] || 'member'
    const name = local.slice(0, 64)
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS)

    const user = this.userRepo.create({
      organizationId: actor.organizationId,
      email,
      passwordHash: null,
      name,
      role: dto.role,
      status: 'invited',
      inviteNote: dto.note?.trim() || null,
      inviteExpiresAt,
      title: null,
      bio: null,
      lastLoginAt: null,
    })
    await this.userRepo.save(user)
    return this.toListItem(user)
  }

  /**
   * 重发邀请：刷新过期时间。
   */
  async resendInvite(
    actor: AuthUserPayload,
    id: string,
  ): Promise<ResendInviteResult> {
    const user = await this.findInOrg(actor.organizationId, id)
    if (user.status !== 'invited') {
      throw new BadRequestException('仅待接受邀请的成员可重发')
    }

    user.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS)
    await this.userRepo.save(user)

    return {
      id: String(user.id),
      email: user.email,
      inviteExpiresAt: user.inviteExpiresAt.toISOString(),
    }
  }

  /**
   * 启停成员状态。
   */
  async updateStatus(
    actor: AuthUserPayload,
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserListItem> {
    if (String(id) === String(actor.id) && dto.status === 'disabled') {
      throw new BadRequestException('不能停用当前登录账号')
    }

    const user = await this.findInOrg(actor.organizationId, id)

    if (dto.status === 'disabled') {
      if (user.status === 'disabled') {
        return this.toListItem(user)
      }
      user.status = 'disabled'
      await this.userRepo.save(user)
      await this.revokeUserSessions(user.id)
      return this.toListItem(user)
    }

    // dto.status === 'active'
    if (user.status === 'invited') {
      throw new BadRequestException(
        '待接受邀请的成员无法直接启用，请等待接受或重新邀请',
      )
    }
    if (user.status === 'active') {
      return this.toListItem(user)
    }
    if (!user.passwordHash) {
      throw new BadRequestException('该账号尚无密码，无法启用')
    }

    user.status = 'active'
    await this.userRepo.save(user)
    return this.toListItem(user)
  }

  /**
   * 查找本组织用户。
   */
  private async findInOrg(organizationId: string, id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, organizationId },
    })
    if (!user) {
      throw new NotFoundException('成员不存在')
    }
    return user
  }

  /**
   * 吊销用户全部未吊销会话。
   */
  private async revokeUserSessions(userId: string): Promise<void> {
    await this.sessionRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    )
  }

  /**
   * Entity → 列表项。
   */
  private toListItem(user: User): UserListItem {
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt
        ? new Date(user.lastLoginAt).toISOString()
        : null,
      createdAt: new Date(user.createdAt).toISOString(),
    }
  }
}
