import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthUserPayload } from '../auth/interfaces/auth-user.interface'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UpdateSecurityDto } from './dto/update-security.dto'
import { MeService } from './me.service'

/**
 * 当前用户设置 API。
 */
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * 更新个人资料。
   */
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.meService.updateProfile(user, dto)
  }

  /**
   * 读取通知偏好。
   */
  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthUserPayload) {
    return this.meService.getPreferences(user.id)
  }

  /**
   * 更新通知偏好。
   */
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.meService.updatePreferences(user.id, dto)
  }

  /**
   * 更新安全开关。
   */
  @Patch('security')
  updateSecurity(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateSecurityDto,
  ) {
    return this.meService.updateSecurity(user.id, dto)
  }

  /**
   * 修改密码（成功后全部会话失效）。
   */
  @Post('password')
  changePassword(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.meService.changePassword(user, dto)
  }

  /**
   * 活动会话列表。
   */
  @Get('sessions')
  listSessions(@CurrentUser() user: AuthUserPayload) {
    return this.meService.listSessions(user)
  }

  /**
   * 撤销指定会话。
   */
  @Delete('sessions/:id')
  revokeSession(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.meService.revokeSession(user, id)
  }
}
