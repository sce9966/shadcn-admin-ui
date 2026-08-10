import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from '../../entities/session.entity'
import { User } from '../../entities/user.entity'
import { UserPreference } from '../../entities/user-preference.entity'
import { MeController } from './me.controller'
import { MeService } from './me.service'

/**
 * 当前用户设置模块。
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference, Session])],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
