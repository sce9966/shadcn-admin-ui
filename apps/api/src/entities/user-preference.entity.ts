import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './user.entity'

/**
 * 用户通知偏好（与 User 1:1）。
 */
@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ name: 'notify_security', type: 'boolean', default: true })
  notifySecurity!: boolean

  @Column({ name: 'notify_invite', type: 'boolean', default: true })
  notifyInvite!: boolean

  @Column({ name: 'notify_weekly', type: 'boolean', default: false })
  notifyWeekly!: boolean

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
}
