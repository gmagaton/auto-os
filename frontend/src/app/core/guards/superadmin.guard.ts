import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Activate admin session if available
  const adminSession = authService.getAdminSession();
  if (adminSession) {
    authService.activateSession('__admin__');
    return true;
  }

  router.navigate(['/login']);
  return false;
};
