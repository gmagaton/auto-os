import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { EmpresasAdminService, EmpresaDetail, EmpresaStats } from './empresas.service';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatDividerModule, DatePipe, CurrencyPipe,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/empresas">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ empresa()?.nome }}</h1>
      <span class="spacer"></span>
      <button mat-stroked-button (click)="router.navigate(['/admin/empresas', empresa()?.id, 'editar'])">
        <mat-icon>edit</mat-icon> Editar
      </button>
      <button mat-raised-button color="primary" (click)="acessar()">
        <mat-icon>open_in_new</mat-icon> Acessar
      </button>
    </div>

    @if (loading()) {
      <mat-spinner diameter="40" />
    } @else if (empresa(); as e) {
      <div class="detail-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Informacoes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-row"><strong>Slug:</strong> {{ e.slug }}</div>
            <div class="info-row"><strong>Email:</strong> {{ e.email || '-' }}</div>
            <div class="info-row"><strong>Telefone:</strong> {{ e.telefone || '-' }}</div>
            <div class="info-row"><strong>Endereco:</strong> {{ e.endereco || '-' }}</div>
            <div class="info-row"><strong>Plano:</strong> {{ e.plano || '-' }}</div>
            <div class="info-row"><strong>Vencimento:</strong> {{ e.dataVencimento ? (e.dataVencimento | date:'dd/MM/yyyy') : '-' }}</div>
            <div class="info-row">
              <strong>Status:</strong>
              <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span>
            </div>
            <div class="info-row"><strong>Criada em:</strong> {{ e.criadoEm | date:'dd/MM/yyyy HH:mm' }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Estatisticas</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (stats(); as s) {
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ s.usuarios }}</div>
                  <div class="stat-label">Usuarios</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ s.ordens }}</div>
                  <div class="stat-label">Ordens</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ s.faturamento | currency:'BRL':'symbol':'1.0-0' }}</div>
                  <div class="stat-label">Faturamento</div>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Contadores</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-row"><strong>Usuarios:</strong> {{ e._count.usuarios }}</div>
            <div class="info-row"><strong>Clientes:</strong> {{ e._count.clientes }}</div>
            <div class="info-row"><strong>Veiculos:</strong> {{ e._count.veiculos }}</div>
            <div class="info-row"><strong>Ordens:</strong> {{ e._count.ordens }}</div>
            <div class="info-row"><strong>Servicos:</strong> {{ e._count.servicos }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="action-buttons">
        @if (e.status === 'ATIVA') {
          <button mat-stroked-button color="warn" (click)="alterarStatus('SUSPENSA')">
            <mat-icon>pause</mat-icon> Suspender
          </button>
        }
        @if (e.status === 'SUSPENSA') {
          <button mat-stroked-button color="primary" (click)="alterarStatus('ATIVA')">
            <mat-icon>play_arrow</mat-icon> Reativar
          </button>
          <button mat-stroked-button color="warn" (click)="alterarStatus('CANCELADA')">
            <mat-icon>cancel</mat-icon> Cancelar
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .spacer { flex: 1 1 auto; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .info-row { padding: 8px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { color: #666; }
    .action-buttons { display: flex; gap: 12px; margin-top: 24px; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-ativa { background: #e8f5e9; color: #2e7d32; }
    .status-suspensa { background: #fff3e0; color: #e65100; }
    .status-cancelada { background: #ffebee; color: #c62828; }
  `],
})
export class EmpresaDetailComponent implements OnInit {
  private readonly empresasService = inject(EmpresasAdminService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  loading = signal(true);
  empresa = signal<EmpresaDetail | null>(null);
  stats = signal<EmpresaStats | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadData(id);
  }

  loadData(id: string): void {
    this.loading.set(true);
    this.empresasService.findOne(id).subscribe({
      next: (empresa) => {
        this.empresa.set(empresa);
        this.loading.set(false);
        this.empresasService.getStats(id).subscribe({
          next: (stats) => this.stats.set(stats),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  alterarStatus(status: string): void {
    const id = this.empresa()?.id;
    if (!id) return;
    this.empresasService.updateStatus(id, status).subscribe(() => this.loadData(id));
  }

  acessar(): void {
    const slug = this.empresa()?.slug;
    if (slug) this.router.navigate([`/${slug}/dashboard`]);
  }
}
