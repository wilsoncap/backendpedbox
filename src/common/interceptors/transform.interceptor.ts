import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | PaginatedResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === 'object' &&
          'meta' in value &&
          'data' in value
        ) {
          return value as PaginatedResponse<T>;
        }

        return { data: value };
      }),
    );
  }
}
