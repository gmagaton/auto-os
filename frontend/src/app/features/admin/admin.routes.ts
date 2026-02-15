import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'empresas',
    pathMatch: 'full',
  },
  {
    path: 'empresas',
    loadComponent: () => import('./empresas/empresa-list.component').then(m => m.EmpresaListComponent),
  },
];
