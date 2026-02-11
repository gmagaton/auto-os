import { Routes } from '@angular/router';

export const agendaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./agenda.component').then((m) => m.AgendaComponent),
  },
];
