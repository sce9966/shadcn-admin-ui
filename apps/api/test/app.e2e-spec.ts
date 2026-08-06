import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { HealthController } from './../src/modules/health/health.controller'
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor'

/**
 * 不启动 TypeORM，仅验证健康检查与统一响应包装。
 */
describe('HealthController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    )
    app.useGlobalInterceptors(new TransformInterceptor())
    await app.init()
  })

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe(0)
        expect(res.body.data.status).toBe('ok')
      })
  })

  afterEach(async () => {
    await app.close()
  })
})
