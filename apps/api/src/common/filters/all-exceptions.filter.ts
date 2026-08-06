import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse, fail } from '../interfaces/api-response.interface'

/**
 * 将异常转换为统一响应结构。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 50000
    let message = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>
        if (typeof obj.message === 'string') {
          message = obj.message
        } else if (Array.isArray(obj.message)) {
          message = obj.message.join('; ')
        }
        if (typeof obj.code === 'number') {
          code = obj.code
        } else {
          code = status * 100
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    const payload: ApiResponse<null> = fail(code, message)
    response.status(status).json(payload)
  }
}
