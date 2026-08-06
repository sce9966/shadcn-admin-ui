import { Controller, Get } from '@nestjs/common'

/**
 * 健康检查：用于脚手架联调与探活。
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }
}
