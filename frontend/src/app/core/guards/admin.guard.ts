import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate([tenantService.route('/dashboard')]);
  return false;
};
