import { Routes } from '@angular/router';

export const checklistRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./checklist-config.component').then((m) => m.ChecklistConfigComponent),
  },
];
