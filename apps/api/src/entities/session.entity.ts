import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './user.entity'

/**
 * 登录会话（JWT jti 吊销表）。
 */
@Entity('sessions')
@Index('idx_sessions_user', ['userId', 'revokedAt'])
export class Session {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ name: 'token_jti', type: 'varchar', length: 64, unique: true })
  tokenJti!: string

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date
}
