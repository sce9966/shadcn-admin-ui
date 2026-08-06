import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { ApiResponse, ok } from '../interfaces/api-response.interface'

/**
 * 将控制器返回值包装为统一 `{ code, message, data }` 结构。
 * 若返回值已是该结构则原样透传。
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data &&
          'data' in data
        ) {
          return data as ApiResponse<T>
        }
        return ok(data)
      }),
    )
  }
}
