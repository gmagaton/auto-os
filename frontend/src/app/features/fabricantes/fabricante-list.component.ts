import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../shared/services/dialog.service';
import { FabricantesService, Fabricante, Modelo } from './fabricantes.service';
import { FabricanteFormComponent, FabricanteFormData } from './fabricante-form.component';
import { ModeloFormComponent, ModeloFormData } from './modelo-form.component';

@Component({
  selector: 'app-fabricante-list',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './fabricante-list.component.html',
})
export class FabricanteListComponent {
  private readonly fabricantesService = inject(FabricantesService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);

  private allFabricantes = signal<Fabricante[]>([]);
  searchTerm = signal('');
  loading = signal(true);
  expandedIds = signal<Set<string>>(new Set());

  fabricantes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allFabricantes();
    return this.allFabricantes().filter((f) => f.nome.toLowerCase().includes(term));
  });

  constructor() {
    this.loadFabricantes();
  }

  toggleFabricante(id: string): void {
    const current = this.expandedIds();
    const newSet = new Set(current);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.expandedIds.set(newSet);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  loadFabricantes(): void {
    this.loading.set(true);
    this.fabricantesService.getAll().subscribe({
      next: (fabricantes) => {
        this.allFabricantes.set(fabricantes);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar fabricantes', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  getModelosCount(fabricante: Fabricante): number {
    return fabricante.modelos?.length || 0;
  }

  openFabricanteDialog(fabricante?: Fabricante): void {
    const dialogRef = this.dialog.open(FabricanteFormComponent, {
      data: { fabricante } as FabricanteFormData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (fabricante) {
          this.updateFabricante(fabricante.id, result);
        } else {
          this.createFabricante(result);
        }
      }
    });
  }

  createFabricante(data: Partial<Fabricante>): void {
    this.fabricantesService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Fabricante criado com sucesso', 'Fechar', { duration: 3000 });
        this.loadFabricantes();
      },
      error: () => {
        this.snackBar.open('Erro ao criar fabricante', 'Fechar', { duration: 3000 });
      },
    });
  }

  updateFabricante(id: string, data: Partial<Fabricante>): void {
    this.fabricantesService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Fabricante atualizado com sucesso', 'Fechar', { duration: 3000 });
        this.loadFabricantes();
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar fabricante', 'Fechar', { duration: 3000 });
      },
    });
  }

  deleteFabricante(fabricante: Fabricante): void {
    this.dialogService.confirm({
      title: 'Excluir Fabricante',
      message: `Deseja realmente excluir o fabricante "${fabricante.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.fabricantesService.delete(fabricante.id).subscribe({
          next: () => {
            this.snackBar.open('Fabricante excluido com sucesso', 'Fechar', { duration: 3000 });
            this.loadFabricantes();
          },
          error: () => {
            this.snackBar.open('Erro ao excluir fabricante', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  openModeloDialog(fabricanteId: string, modelo?: Modelo): void {
    const dialogRef = this.dialog.open(ModeloFormComponent, {
      data: {
        modelo,
        fabricanteId,
        fabricantes: this.fabricantes(),
      } as ModeloFormData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (modelo) {
          this.updateModelo(modelo.id, result);
        } else {
          this.createModelo(result);
        }
      }
    });
  }

  createModelo(data: Partial<Modelo>): void {
    this.fabricantesService.createModelo(data).subscribe({
      next: () => {
        this.snackBar.open('Modelo criado com sucesso', 'Fechar', { duration: 3000 });
        this.loadFabricantes();
      },
      error: () => {
        this.snackBar.open('Erro ao criar modelo', 'Fechar', { duration: 3000 });
      },
    });
  }

  updateModelo(id: string, data: Partial<Modelo>): void {
    this.fabricantesService.updateModelo(id, data).subscribe({
      next: () => {
        this.snackBar.open('Modelo atualizado com sucesso', 'Fechar', { duration: 3000 });
        this.loadFabricantes();
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar modelo', 'Fechar', { duration: 3000 });
      },
    });
  }

  deleteModelo(modelo: Modelo): void {
    this.dialogService.confirm({
      title: 'Excluir Modelo',
      message: `Deseja realmente excluir o modelo "${modelo.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.fabricantesService.deleteModelo(modelo.id).subscribe({
          next: () => {
            this.snackBar.open('Modelo excluido com sucesso', 'Fechar', { duration: 3000 });
            this.loadFabricantes();
          },
          error: () => {
            this.snackBar.open('Erro ao excluir modelo', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
