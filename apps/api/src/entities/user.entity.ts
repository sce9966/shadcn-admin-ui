import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Organization } from './organization.entity'
import { Session } from './session.entity'

/** 用户角色。 */
export type UserRole = 'admin' | 'ops' | 'viewer'

/** 用户状态。 */
export type UserStatus = 'active' | 'invited' | 'disabled'

/**
 * 工作区成员。
 */
@Entity('users')
@Index('uk_users_email', ['email'], { unique: true })
@Index('idx_users_org', ['organizationId'])
@Index('idx_users_org_status', ['organizationId', 'status'])
@Index('idx_users_org_role', ['organizationId', 'role'])
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization

  @Column({ type: 'varchar', length: 255 })
  email!: string

  /** invited 用户可为空，直至接受邀请设密。 */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null

  @Column({ type: 'varchar', length: 64 })
  name!: string

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null

  @Column({ type: 'text', nullable: true })
  bio!: string | null

  @Column({ type: 'enum', enum: ['admin', 'ops', 'viewer'], default: 'ops' })
  role!: UserRole

  @Column({
    type: 'enum',
    enum: ['active', 'invited', 'disabled'],
    default: 'active',
  })
  status!: UserStatus

  @Column({ name: 'invite_note', type: 'varchar', length: 512, nullable: true })
  inviteNote!: string | null

  @Column({ name: 'invite_expires_at', type: 'datetime', nullable: true })
  inviteExpiresAt!: Date | null

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt!: Date | null

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled!: boolean

  @Column({ name: 'idle_logout', type: 'boolean', default: true })
  idleLogout!: boolean

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[]

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
}
