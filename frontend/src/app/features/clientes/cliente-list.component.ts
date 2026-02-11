import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, Subject } from 'rxjs';
import { Cliente, ClientesService } from './clientes.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ClienteFormComponent, ClienteFormData } from './cliente-form.component';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './cliente-list.component.html',
})
export class ClienteListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly searchSubject = new Subject<string>();

  clientes = signal<Cliente[]>([]);
  loading = signal(false);
  searchTerm = '';
  displayedColumns = ['nome', 'telefone', 'email', 'veiculos', 'acoes'];

  ngOnInit(): void {
    this.loadClientes();
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.loadClientes(term);
    });
  }

  loadClientes(busca?: string): void {
    this.loading.set(true);
    this.clientesService.getAll(busca).subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar clientes', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  formatTelefone(telefone: string): string {
    if (!telefone) return '-';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return telefone;
  }

  goToDetail(cliente: Cliente): void {
    this.router.navigate(['/clientes', cliente.id]);
  }

  openForm(cliente?: Cliente): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      data: { cliente } as ClienteFormData,
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadClientes(this.searchTerm);
        this.snackBar.open(
          cliente ? 'Cliente atualizado com sucesso' : 'Cliente criado com sucesso',
          'Fechar',
          { duration: 3000 }
        );
      }
    });
  }

  confirmDelete(cliente: Cliente): void {
    this.dialogService.confirm({
      title: 'Excluir Cliente',
      message: `Deseja realmente excluir o cliente "${cliente.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.clientesService.delete(cliente.id).subscribe({
          next: () => {
            this.loadClientes(this.searchTerm);
            this.snackBar.open('Cliente excluido com sucesso', 'Fechar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao excluir cliente', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
