import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { TenantService } from '../../../core/services/tenant.service';
import { EmpresasAdminService, EmpresaListItem } from './empresas.service';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatMenuModule, DatePipe,
  ],
  templateUrl: './empresa-list.component.html',
})
export class EmpresaListComponent implements OnInit {
  private readonly empresasService = inject(EmpresasAdminService);
  private readonly tenantService = inject(TenantService);
  readonly router = inject(Router);

  private readonly searchSubject = new Subject<string>();

  loading = signal(true);
  empresas = signal<EmpresaListItem[]>([]);
  busca = '';

  displayedColumns = ['nome', 'slug', 'status', 'usuarios', 'ordens', 'vencimento', 'acoes'];

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.load(term);
    });
    this.load();
  }

  load(busca?: string): void {
    this.loading.set(true);
    this.empresasService.findAll(busca || undefined).subscribe({
      next: (data) => { this.empresas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  alterarStatus(id: string, status: string): void {
    this.empresasService.updateStatus(id, status).subscribe(() => this.load());
  }

  acessarEmpresa(empresa: EmpresaListItem): void {
    this.tenantService.setEmpresa({ id: empresa.id, slug: empresa.slug, nome: empresa.nome });
    this.router.navigate([`/${empresa.slug}/dashboard`]);
  }
}
