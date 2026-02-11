import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, Subject } from 'rxjs';
import { Veiculo, VeiculosService } from './veiculos.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-veiculo-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './veiculo-list.component.html',
})
export class VeiculoListComponent implements OnInit {
  private readonly veiculosService = inject(VeiculosService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly searchSubject = new Subject<string>();

  veiculos = signal<Veiculo[]>([]);
  loading = signal(false);
  searchTerm = '';
  displayedColumns = ['placa', 'fabricanteModelo', 'cor', 'ano', 'cliente', 'acoes'];

  ngOnInit(): void {
    this.loadVeiculos();
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.loadVeiculos(term);
    });
  }

  loadVeiculos(busca?: string): void {
    this.loading.set(true);
    this.veiculosService.getAll(busca ? { busca } : undefined).subscribe({
      next: (veiculos) => {
        this.veiculos.set(veiculos);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar veiculos', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  addVeiculo(): void {
    this.router.navigate(['/veiculos/novo']);
  }

  editVeiculo(veiculo: Veiculo): void {
    this.router.navigate(['/veiculos', veiculo.id, 'editar']);
  }

  confirmDelete(veiculo: Veiculo): void {
    this.dialogService.confirm({
      title: 'Excluir Veiculo',
      message: `Deseja realmente excluir o veiculo "${veiculo.placa}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.veiculosService.delete(veiculo.id).subscribe({
          next: () => {
            this.loadVeiculos(this.searchTerm);
            this.snackBar.open('Veiculo excluido com sucesso', 'Fechar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao excluir veiculo', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
