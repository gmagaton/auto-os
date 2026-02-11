import { Routes } from '@angular/router';
import { VeiculoListComponent } from './veiculo-list.component';
import { VeiculoFormComponent } from './veiculo-form.component';

export const veiculosRoutes: Routes = [
  { path: '', component: VeiculoListComponent },
  { path: 'novo', component: VeiculoFormComponent },
  { path: ':id/editar', component: VeiculoFormComponent },
];
