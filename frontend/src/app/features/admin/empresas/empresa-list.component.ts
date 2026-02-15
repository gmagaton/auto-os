import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { EmpresasAdminService, EmpresaListItem } from './empresas.service';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatMenuModule, DatePipe,
  ],
  template: `
    <div class="page-header">
      <h1>Empresas</h1>
      <button mat-raised-button color="primary" (click)="router.navigate(['/admin/empresas/nova'])">
        <mat-icon>add</mat-icon>
        Nova Empresa
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Buscar</mat-label>
      <input matInput [(ngModel)]="busca" (keyup.enter)="load()" placeholder="Nome, slug ou email...">
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    @if (loading()) {
      <mat-spinner diameter="40" />
    } @else {
      <table mat-table [dataSource]="empresas()" class="mat-elevation-z2">
        <ng-container matColumnDef="nome">
          <th mat-header-cell *matHeaderCellDef>Nome</th>
          <td mat-cell *matCellDef="let e">{{ e.nome }}</td>
        </ng-container>

        <ng-container matColumnDef="slug">
          <th mat-header-cell *matHeaderCellDef>Slug</th>
          <td mat-cell *matCellDef="let e">{{ e.slug }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let e">
            <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="usuarios">
          <th mat-header-cell *matHeaderCellDef>Usuarios</th>
          <td mat-cell *matCellDef="let e">{{ e._count.usuarios }}</td>
        </ng-container>

        <ng-container matColumnDef="ordens">
          <th mat-header-cell *matHeaderCellDef>Ordens</th>
          <td mat-cell *matCellDef="let e">{{ e._count.ordens }}</td>
        </ng-container>

        <ng-container matColumnDef="vencimento">
          <th mat-header-cell *matHeaderCellDef>Vencimento</th>
          <td mat-cell *matCellDef="let e">{{ e.dataVencimento | date:'dd/MM/yyyy' }}</td>
        </ng-container>

        <ng-container matColumnDef="acoes">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let e">
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="router.navigate(['/admin/empresas', e.id])">
                <mat-icon>visibility</mat-icon> Detalhes
              </button>
              <button mat-menu-item (click)="router.navigate(['/admin/empresas', e.id, 'editar'])">
                <mat-icon>edit</mat-icon> Editar
              </button>
              <button mat-menu-item (click)="acessarEmpresa(e)">
                <mat-icon>open_in_new</mat-icon> Acessar
              </button>
              @if (e.status === 'ATIVA') {
                <button mat-menu-item (click)="alterarStatus(e.id, 'SUSPENSA')">
                  <mat-icon>pause</mat-icon> Suspender
                </button>
              }
              @if (e.status === 'SUSPENSA') {
                <button mat-menu-item (click)="alterarStatus(e.id, 'ATIVA')">
                  <mat-icon>play_arrow</mat-icon> Reativar
                </button>
              }
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="router.navigate(['/admin/empresas', row.id])"></tr>
      </table>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .search-field { width: 100%; margin-bottom: 16px; }
    table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-ativa { background: #e8f5e9; color: #2e7d32; }
    .status-suspensa { background: #fff3e0; color: #e65100; }
    .status-cancelada { background: #ffebee; color: #c62828; }
  `],
})
export class EmpresaListComponent implements OnInit {
  private readonly empresasService = inject(EmpresasAdminService);
  readonly router = inject(Router);

  loading = signal(true);
  empresas = signal<EmpresaListItem[]>([]);
  busca = '';
  displayedColumns = ['nome', 'slug', 'status', 'usuarios', 'ordens', 'vencimento', 'acoes'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.empresasService.findAll(this.busca || undefined).subscribe({
      next: (data) => { this.empresas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  alterarStatus(id: string, status: string): void {
    this.empresasService.updateStatus(id, status).subscribe(() => this.load());
  }

  acessarEmpresa(empresa: EmpresaListItem): void {
    this.router.navigate([`/${empresa.slug}/dashboard`]);
  }
}
