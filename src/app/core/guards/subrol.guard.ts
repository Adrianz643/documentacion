import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function subrolGuard(clave: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.tieneSubrol(clave)) return router.createUrlTree(['/dashboard']);
    return true;
  };
}
