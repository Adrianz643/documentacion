import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        console.error(`HTTP ${err.status} en ${req.method} ${req.url}:`, err.error?.message ?? err.message);
      } else {
        console.error('HTTP error:', err);
      }
      return throwError(() => err);
    })
  );
