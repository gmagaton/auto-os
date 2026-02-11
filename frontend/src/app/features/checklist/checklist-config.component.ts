import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChecklistService, ItemChecklist } from './checklist.service';
import { ItemFormComponent, ItemFormData } from './item-form.component';

@Component({
  selector: 'app-checklist-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './checklist-config.component.html',
})
export class ChecklistConfigComponent {
  private readonly checklistService = inject(ChecklistService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private allItens = signal<ItemChecklist[]>([]);
  categorias = signal<string[]>([]);
  searchTerm = signal('');
  filtroCategoria = signal<string>('');
  loading = signal(true);
  displayedColumns = ['ordem', 'nome', 'categoria', 'ativo', 'acoes'];

  itens = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const categoria = this.filtroCategoria();
    let result = this.allItens();

    if (categoria) {
      result = result.filter((i) => i.categoria === categoria);
    }
    if (term) {
      result = result.filter(
        (i) => i.nome.toLowerCase().includes(term) || i.categoria.toLowerCase().includes(term)
      );
    }
    return result;
  });

  onCategoriaChange(categoria: string): void {
    this.filtroCategoria.set(categoria);
  }

  constructor() {
    this.loadItens();
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.checklistService.getCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
    });
  }

  loadItens(): void {
    this.loading.set(true);
    this.checklistService.getItens(true).subscribe({
      next: (itens) => {
        this.allItens.set(itens);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar itens', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  openForm(item?: ItemChecklist): void {
    const dialogRef = this.dialog.open(ItemFormComponent, {
      width: '400px',
      data: { item } as ItemFormData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (item) {
          this.updateItem(item.id, result);
        } else {
          this.createItem(result);
        }
      }
    });
  }

  createItem(data: Partial<ItemChecklist>): void {
    this.checklistService.createItem(data).subscribe({
      next: () => {
        this.snackBar.open('Item criado com sucesso', 'Fechar', { duration: 3000 });
        this.loadItens();
      },
      error: () => {
        this.snackBar.open('Erro ao criar item', 'Fechar', { duration: 3000 });
      },
    });
  }

  updateItem(id: string, data: Partial<ItemChecklist>): void {
    this.checklistService.updateItem(id, data).subscribe({
      next: () => {
        this.snackBar.open('Item atualizado com sucesso', 'Fechar', { duration: 3000 });
        this.loadItens();
      },
      error: () => {
        this.snackBar.open('Erro ao atualizar item', 'Fechar', { duration: 3000 });
      },
    });
  }

  toggleAtivo(item: ItemChecklist): void {
    this.checklistService.updateItem(item.id, { ativo: !item.ativo }).subscribe({
      next: () => {
        this.snackBar.open(`Item ${item.ativo ? 'desativado' : 'ativado'}`, 'Fechar', { duration: 3000 });
        this.loadItens();
      },
      error: () => {
        this.snackBar.open('Erro ao alterar status', 'Fechar', { duration: 3000 });
      },
    });
  }
}
