import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import type { AuthUserPayload } from './interfaces/auth-user.interface'

/**
 * 鉴权 API：注册 / 登录 / 登出 / 当前用户。
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 注册并创建工作区。
   */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.requestMeta(req))
  }

  /**
   * 登录。
   */
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.requestMeta(req))
  }

  /**
   * 登出（吊销当前 session）。
   */
  @Post('logout')
  logout(@CurrentUser() user: AuthUserPayload) {
    return this.authService.logout(user)
  }

  /**
   * 当前用户。
   */
  @Get('me')
  me(@CurrentUser() user: AuthUserPayload) {
    return this.authService.me(user)
  }

  /**
   * 提取 UA / IP。
   */
  private requestMeta(req: Request) {
    const forwarded = req.headers['x-forwarded-for']
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip
    return {
      userAgent: req.headers['user-agent'],
      ip,
    }
  }
}
