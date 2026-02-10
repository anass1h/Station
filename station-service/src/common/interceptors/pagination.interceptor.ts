import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Intercepteur qui ajoute les headers de pagination standard.
 * À appliquer sur les controllers qui retournent des PaginatedResponse.
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'meta' in data) {
          const paginatedData = data as {
            meta: {
              total: number;
              page: number;
              perPage: number;
              totalPages: number;
            };
          };
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Total-Count', paginatedData.meta.total);
          response.setHeader('X-Page', paginatedData.meta.page);
          response.setHeader('X-Per-Page', paginatedData.meta.perPage);
          response.setHeader('X-Total-Pages', paginatedData.meta.totalPages);
        }
        return data;
      }),
    );
  }
}
