import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './modules/auth/auth.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { HealthModule } from './modules/health/health.module'
import { UsersModule } from './modules/users/users.module'

/**
 * 根模块：全局配置、TypeORM MySQL、健康检查与鉴权。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get('DB_PORT', 3306)),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'novaops'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV', 'development') === 'development',
        charset: 'utf8mb4',
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    DashboardModule,
  ],
})
export class AppModule {}

