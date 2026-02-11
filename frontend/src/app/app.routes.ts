import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
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
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'portal',
    loadChildren: () => import('./features/portal/portal.routes').then(m => m.portalRoutes),
  },
];
