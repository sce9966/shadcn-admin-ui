import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

/**
 * 启动 Nest API：全局前缀、CORS、校验管道、统一响应与异常。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(','),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  const port = config.get<number>('PORT', 3000)
  await app.listen(port)
}

void bootstrap()
