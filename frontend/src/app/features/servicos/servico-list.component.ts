import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../shared/services/dialog.service';
import { Servico, ServicosService } from './servicos.service';
import { ServicoFormComponent, ServicoFormData } from './servico-form.component';

@Component({
  selector: 'app-servico-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './servico-list.component.html',
})
export class ServicoListComponent implements OnInit {
  private readonly servicosService = inject(ServicosService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);

  private allServicos = signal<Servico[]>([]);
  searchTerm = signal('');
  loading = signal(false);
  filtroTipo = signal<string>('');
  displayedColumns = ['nome', 'tipo', 'valor', 'ativo', 'acoes'];

  servicos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const tipo = this.filtroTipo();
    let result = this.allServicos();

    if (tipo) {
      result = result.filter((s) => s.tipo === tipo);
    }
    if (term) {
      result = result.filter((s) => s.nome.toLowerCase().includes(term));
    }
    return result;
  });

  ngOnInit(): void {
    this.loadServicos();
  }

  loadServicos(): void {
    this.loading.set(true);
    this.servicosService.getAll().subscribe({
      next: (servicos) => {
        this.allServicos.set(servicos);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar servicos', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onTipoChange(tipo: string): void {
    this.filtroTipo.set(tipo);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  openForm(servico?: Servico): void {
    const dialogRef = this.dialog.open(ServicoFormComponent, {
      data: { servico } as ServicoFormData,
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadServicos();
      }
    });
  }

  confirmDelete(servico: Servico): void {
    this.dialogService.confirm({
      title: 'Excluir Servico',
      message: `Deseja realmente excluir o servico "${servico.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.servicosService.delete(servico.id).subscribe({
          next: () => {
            this.snackBar.open('Servico excluido com sucesso', 'Fechar', { duration: 3000 });
            this.loadServicos();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao excluir servico', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
