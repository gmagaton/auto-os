import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';

export const tenantGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tenantService = inject(TenantService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const slugFromUrl = route.paramMap.get('slug');
  if (!slugFromUrl) {
    router.navigate(['/login']);
    return false;
  }

  // 1) Try to activate the session for this slug (regular user logged into this empresa)
  if (authService.activateSession(slugFromUrl)) {
    return true;
  }

  // 2) If no direct session, check if there's a SUPERADMIN session that can access any empresa
  const adminSession = authService.getAdminSession();
  if (adminSession) {
    authService.activateSession('__admin__');
    // Update tenant context to the target empresa
    tenantService.setEmpresa({
      ...adminSession.empresa,
      slug: slugFromUrl,
    });
    return true;
  }

  // 3) No valid session for this slug
  router.navigate(['/login']);
  return false;
};
