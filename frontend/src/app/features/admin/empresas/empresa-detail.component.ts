import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { TenantService } from '../../../core/services/tenant.service';
import { EmpresasAdminService, EmpresaDetail, EmpresaStats } from './empresas.service';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, DatePipe, CurrencyPipe,
  ],
  templateUrl: './empresa-detail.component.html',
})
export class EmpresaDetailComponent implements OnInit {
  private readonly empresasService = inject(EmpresasAdminService);
  private readonly tenantService = inject(TenantService);
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
    const e = this.empresa();
    if (!e) return;
    this.tenantService.setEmpresa({ id: e.id, slug: e.slug, nome: e.nome, logoUrl: e.logoUrl || undefined });
    this.router.navigate([`/${e.slug}/dashboard`]);
  }
}
