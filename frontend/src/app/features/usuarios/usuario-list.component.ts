import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Usuario } from '../../core/models/usuario.model';
import { UsuariosService } from './usuarios.service';
import { DialogService } from '../../shared/services/dialog.service';
import { UsuarioFormComponent, UsuarioFormData } from './usuario-form.component';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './usuario-list.component.html',
})
export class UsuarioListComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);

  private allUsuarios = signal<Usuario[]>([]);
  searchTerm = signal('');
  filtroPapel = signal<string>('');
  loading = signal(false);
  displayedColumns = ['nome', 'email', 'papel', 'ativo', 'acoes'];

  usuarios = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const papel = this.filtroPapel();
    let result = this.allUsuarios();

    if (papel) {
      result = result.filter((u) => u.papel === papel);
    }
    if (term) {
      result = result.filter(
        (u) => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
    }
    return result;
  });

  onPapelChange(papel: string): void {
    this.filtroPapel.set(papel);
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.usuariosService.getAll().subscribe({
      next: (usuarios) => {
        this.allUsuarios.set(usuarios);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  openForm(usuario?: Usuario): void {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      data: { usuario } as UsuarioFormData,
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsuarios();
      }
    });
  }

  confirmDelete(usuario: Usuario): void {
    this.dialogService.confirm({
      title: 'Excluir Usuario',
      message: `Deseja realmente excluir o usuario "${usuario.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.usuariosService.delete(usuario.id).subscribe({
          next: () => {
            this.snackBar.open('Usuario excluido com sucesso', 'Fechar', { duration: 3000 });
            this.loadUsuarios();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao excluir usuario', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
