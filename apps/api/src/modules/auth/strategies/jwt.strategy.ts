import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { Session } from '../../../entities/session.entity'
import { User } from '../../../entities/user.entity'
import { AuthUserPayload } from '../interfaces/auth-user.interface'

/** JWT 载荷。 */
interface JwtPayload {
  sub: string
  org: string
  role: string
  jti: string
}

/**
 * 校验 JWT，并核对 Session 未吊销且用户仍为 active。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    })
  }

  /**
   * @param payload JWT 载荷
   */
  async validate(payload: JwtPayload): Promise<AuthUserPayload> {
    if (!payload?.sub || !payload?.jti) {
      throw new UnauthorizedException('未登录或登录已失效')
    }

    const session = await this.sessionRepo.findOne({
      where: {
        tokenJti: payload.jti,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    })
    if (!session) {
      throw new UnauthorizedException('未登录或登录已失效')
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: { organization: true },
    })
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('未登录或登录已失效')
    }

    return {
      id: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      title: user.title,
      organizationId: String(user.organizationId),
      organizationName: user.organization?.name ?? '',
      jti: payload.jti,
    }
  }
}
