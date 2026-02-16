import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { tenantGuard } from './core/guards/tenant.guard';
import { superAdminGuard } from './core/guards/superadmin.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'portal',
    loadChildren: () => import('./features/portal/portal.routes').then(m => m.portalRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, superAdminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: ':slug/login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: ':slug',
    component: LayoutComponent,
    canActivate: [tenantGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.usuariosRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'clientes',
        loadChildren: () => import('./features/clientes/clientes.routes').then(m => m.clientesRoutes),
      },
      {
        path: 'fabricantes',
        loadChildren: () => import('./features/fabricantes/fabricantes.routes').then(m => m.fabricantesRoutes),
      },
      {
        path: 'servicos',
        loadChildren: () => import('./features/servicos/servicos.routes').then(m => m.servicosRoutes),
      },
      {
        path: 'veiculos',
        loadChildren: () => import('./features/veiculos/veiculos.routes').then(m => m.veiculosRoutes),
      },
      {
        path: 'ordens',
        loadChildren: () => import('./features/ordens/ordens.routes').then(m => m.ordensRoutes),
      },
      {
        path: 'checklist',
        loadChildren: () => import('./features/checklist/checklist.routes').then(m => m.checklistRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'agenda',
        loadChildren: () => import('./features/agenda/agenda.routes').then(m => m.agendaRoutes),
      },
    ],
  },
];
