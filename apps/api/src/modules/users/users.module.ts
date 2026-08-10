import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from '../../entities/session.entity'
import { User } from '../../entities/user.entity'
import { RolesGuard } from './guards/roles.guard'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

/**
 * 工作区成员管理模块。
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
