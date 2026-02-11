import { Routes } from '@angular/router';
import { OrdemListComponent } from './ordem-list.component';
import { OrdemFormComponent } from './ordem-form.component';
import { OrdemDetailComponent } from './ordem-detail.component';

export const ordensRoutes: Routes = [
  { path: '', component: OrdemListComponent },
  { path: 'nova', component: OrdemFormComponent },
  { path: ':id', component: OrdemDetailComponent },
  { path: ':id/editar', component: OrdemFormComponent },
];
