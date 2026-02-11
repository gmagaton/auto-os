import { Routes } from '@angular/router';
import { ClienteListComponent } from './cliente-list.component';
import { ClienteDetailComponent } from './cliente-detail.component';

export const clientesRoutes: Routes = [
  { path: '', component: ClienteListComponent },
  { path: ':id', component: ClienteDetailComponent },
];
