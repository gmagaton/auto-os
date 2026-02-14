import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { DashboardService, DashboardData } from './dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxChartsModule,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAdmin = this.authService.isAdmin;

  loading = signal(true);
  data = signal<DashboardData | null>(null);

  // Configuração dos gráficos
  faturamentoData = signal<{ name: string; value: number }[]>([]);
  servicosData = signal<{ name: string; value: number }[]>([]);

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5', '#e91e63', '#ff9800', '#4caf50', '#9c27b0'],
  };

  isMobile = window.innerWidth < 600;
  legendPosition = this.isMobile ? LegendPosition.Below : LegendPosition.Right;
  chartView: [number, number] | undefined = this.isMobile
    ? [window.innerWidth - 48, 220]
    : undefined;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data.set(data);

        // Formatar dados para os gráficos
        this.faturamentoData.set(
          data.faturamento.map((f) => ({
            name: this.formatMes(f.mes),
            value: f.total,
          }))
        );

        this.servicosData.set(
          data.servicosTop.map((s) => ({
            name: s.nome,
            value: s.quantidade,
          }))
        );

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private formatMes(mes: string): string {
    const [ano, mesNum] = mes.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mesNum, 10) - 1]}/${ano.slice(2)}`;
  }

  navigateToOrdens(status?: string): void {
    if (status) {
      this.router.navigate(['/ordens'], { queryParams: { status } });
    } else {
      this.router.navigate(['/ordens']);
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatCurrencyAxis = (value: number): string => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value}`;
  };
}
