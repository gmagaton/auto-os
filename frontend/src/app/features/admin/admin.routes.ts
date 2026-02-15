import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'empresas', pathMatch: 'full' },
      {
        path: 'empresas',
        loadComponent: () => import('./empresas/empresa-list.component').then(m => m.EmpresaListComponent),
      },
      {
        path: 'empresas/nova',
        loadComponent: () => import('./empresas/empresa-form.component').then(m => m.EmpresaFormComponent),
      },
      {
        path: 'empresas/:id',
        loadComponent: () => import('./empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent),
      },
      {
        path: 'empresas/:id/editar',
        loadComponent: () => import('./empresas/empresa-form.component').then(m => m.EmpresaFormComponent),
      },
    ],
  },
];
