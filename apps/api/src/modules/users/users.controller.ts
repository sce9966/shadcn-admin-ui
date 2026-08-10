import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthUserPayload } from '../auth/interfaces/auth-user.interface'
import { Roles } from './decorators/roles.decorator'
import { InviteUserDto } from './dto/invite-user.dto'
import { ListUsersQueryDto } from './dto/list-users.query.dto'
import { UpdateUserStatusDto } from './dto/update-user-status.dto'
import { RolesGuard } from './guards/roles.guard'
import { UsersService } from './users.service'

/**
 * 成员管理 API。
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 分页列表。
   */
  @Get()
  list(
    @CurrentUser() user: AuthUserPayload,
    @Query() query: ListUsersQueryDto,
  ) {
    return this.usersService.list(user, query)
  }

  /**
   * 邀请成员。
   */
  @Post('invites')
  @Roles('admin')
  @UseGuards(RolesGuard)
  invite(@CurrentUser() user: AuthUserPayload, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user, dto)
  }

  /**
   * 重发邀请。
   */
  @Post(':id/resend-invite')
  @Roles('admin')
  @UseGuards(RolesGuard)
  resendInvite(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.resendInvite(user, id)
  }

  /**
   * 启停状态。
   */
  @Patch(':id/status')
  @Roles('admin')
  @UseGuards(RolesGuard)
  updateStatus(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(user, id, dto)
  }
}
