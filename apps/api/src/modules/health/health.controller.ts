import { Controller, Get } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'

/**
 * 健康检查：用于脚手架联调与探活。
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }
}
