import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cliente, ClientesService, Veiculo } from './clientes.service';
import { ClienteFormComponent, ClienteFormData } from './cliente-form.component';
import { VeiculosService } from '../veiculos/veiculos.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './cliente-detail.component.html',
})
export class ClienteDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientesService = inject(ClientesService);
  private readonly veiculosService = inject(VeiculosService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);

  cliente = signal<Cliente | null>(null);
  loading = signal(true);
  veiculoColumns = ['placa', 'modelo', 'cor', 'ano'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCliente(id);
    }
  }

  loadCliente(id: string): void {
    this.loading.set(true);
    this.clientesService.getById(id).subscribe({
      next: (cliente) => {
        this.cliente.set(cliente);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar cliente', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
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

  editCliente(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      data: { cliente: this.cliente() } as ClienteFormData,
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCliente(this.cliente()!.id);
        this.snackBar.open('Cliente atualizado com sucesso', 'Fechar', { duration: 3000 });
      }
    });
  }

  addVeiculo(): void {
    this.router.navigate(['/veiculos/novo'], {
      queryParams: { clienteId: this.cliente()!.id },
    });
  }

  goToVeiculo(veiculo: Veiculo): void {
    this.router.navigate(['/veiculos', veiculo.id, 'editar']);
  }

  deleteVeiculo(veiculo: Veiculo, event: Event): void {
    event.stopPropagation();
    this.dialogService.confirm({
      title: 'Remover Veiculo',
      message: `Deseja realmente remover o veiculo "${veiculo.placa}"?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.veiculosService.delete(veiculo.id).subscribe({
          next: () => {
            this.snackBar.open('Veiculo removido com sucesso', 'Fechar', { duration: 3000 });
            this.loadCliente(this.cliente()!.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao remover veiculo', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }
}
