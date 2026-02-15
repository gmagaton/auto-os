import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';

export const tenantGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tenantService = inject(TenantService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const slugFromUrl = route.paramMap.get('slug');
  const slugFromTenant = tenantService.slug();

  if (slugFromUrl && slugFromUrl !== slugFromTenant) {
    // Slug mismatch - redirect to the correct slug
    router.navigate([tenantService.route('/dashboard')]);
    return false;
  }

  return true;
};
