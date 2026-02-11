import { Routes } from '@angular/router';
import { PortalComponent } from './portal.component';

export const portalRoutes: Routes = [
  { path: ':token', component: PortalComponent },
];
