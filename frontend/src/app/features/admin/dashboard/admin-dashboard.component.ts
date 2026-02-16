import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmpresasAdminService } from '../empresas/empresas.service';

interface DashboardStats {
  ativas: number;
  trial: number;
  vencidas: number;
  mrr: number;
  vencimentosProximos: any[];
  ultimosCadastros: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private service = inject(EmpresasAdminService);
  readonly router = inject(Router);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  vencimentoColumns = ['empresa', 'plano', 'dataFim', 'acoes'];
  cadastroColumns = ['empresa', 'slug', 'usuarios', 'criadoEm'];

  ngOnInit() {
    this.service.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
