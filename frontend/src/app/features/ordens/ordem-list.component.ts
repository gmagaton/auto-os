import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, Subject } from 'rxjs';
import { FiltroOrdens, Ordem, OrdensService, StatusOS } from './ordens.service';
import { DialogService } from '../../shared/services/dialog.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-ordem-list',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatCardModule,
    MatMenuModule,
  ],
  templateUrl: './ordem-list.component.html',
})
export class OrdemListComponent implements OnInit {
  private readonly ordensService = inject(OrdensService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly tenantService = inject(TenantService);

  private readonly searchSubject = new Subject<string>();

  ordens = signal<Ordem[]>([]);
  loading = signal(false);
  filtroStatus = signal<string>('');
  searchTerm = '';
  displayedColumns = ['criadoEm', 'placa', 'cliente', 'status', 'valorTotal', 'acoes'];

  // Detect if mobile for pagination
  private readonly isMobile = window.innerWidth < 600;

  // Filtros avançados
  filtros = signal<FiltroOrdens>({
    status: [],
    inicio: undefined,
    fim: undefined,
    placa: '',
    page: 1,
    limit: this.isMobile ? 10 : 20, // Less items on mobile
  });

  statusOptions = [
    { value: 'AGUARDANDO', label: 'Aguardando' },
    { value: 'APROVADO', label: 'Aprovado' },
    { value: 'AGENDADO', label: 'Agendado' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'FINALIZADO', label: 'Finalizado' },
  ];

  // Paginação
  totalItems = signal(0);

  ngOnInit(): void {
    // Ler filtros da URL
    this.route.queryParams.subscribe((params) => {
      if (params['status']) {
        this.filtros.update((f) => ({
          ...f,
          status: params['status'].split(','),
        }));
      }
      this.loadOrdens();
    });

    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.filtros.update((f) => ({ ...f, placa: term, page: 1 }));
      this.loadOrdens();
    });
  }

  loadOrdens(): void {
    this.loading.set(true);
    this.ordensService.getAll(this.filtros()).subscribe({
      next: (response) => {
        this.ordens.set(response.data);
        this.totalItems.set(response.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar ordens de servico', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onStatusChange(status: string): void {
    this.filtroStatus.set(status);
    if (status) {
      this.filtros.update((f) => ({ ...f, status: [status], page: 1 }));
    } else {
      this.filtros.update((f) => ({ ...f, status: [], page: 1 }));
    }
    this.loadOrdens();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  aplicarFiltros(): void {
    this.filtros.update((f) => ({ ...f, page: 1 }));
    this.loadOrdens();
  }

  limparFiltros(): void {
    this.filtros.set({
      status: [],
      inicio: undefined,
      fim: undefined,
      placa: '',
      page: 1,
      limit: 20,
    });
    this.filtroStatus.set('');
    this.searchTerm = '';
    this.loadOrdens();
  }

  onPageChange(event: PageEvent): void {
    this.filtros.update((f) => ({
      ...f,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    }));
    this.loadOrdens();
  }

  getStatusLabel(status: StatusOS): string {
    const labels: Record<StatusOS, string> = {
      AGUARDANDO: 'Aguardando',
      APROVADO: 'Aprovado',
      AGENDADO: 'Agendado',
      EM_ANDAMENTO: 'Em Andamento',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };
    return labels[status] || status;
  }

  criarNova(): void {
    this.router.navigate([this.tenantService.route('/ordens/nova')]);
  }

  verDetalhes(ordem: Ordem): void {
    this.router.navigate([this.tenantService.route('/ordens'), ordem.id]);
  }

  editar(ordem: Ordem): void {
    this.router.navigate([this.tenantService.route('/ordens'), ordem.id, 'editar']);
  }

  confirmDelete(ordem: Ordem): void {
    this.dialogService.confirm({
      title: 'Excluir Ordem',
      message: `Deseja realmente excluir a ordem do veiculo "${ordem.veiculo.placa}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.ordensService.delete(ordem.id).subscribe({
          next: () => {
            this.snackBar.open('Ordem excluida com sucesso', 'Fechar', { duration: 3000 });
            this.loadOrdens();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao excluir ordem', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  onDateChange(field: 'inicio' | 'fim', event: any): void {
    const date = event.value;
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      this.filtros.update((f) => ({ ...f, [field]: isoDate }));
    } else {
      this.filtros.update((f) => ({ ...f, [field]: undefined }));
    }
    this.aplicarFiltros();
  }

  limparDatas(): void {
    this.filtros.update((f) => ({ ...f, inicio: undefined, fim: undefined }));
    this.aplicarFiltros();
  }

  onStatusSelectChange(selectedStatus: string[]): void {
    this.filtros.update((f) => ({ ...f, status: selectedStatus }));
    this.aplicarFiltros();
  }

  onPlacaInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filtros.update((f) => ({ ...f, placa: value }));
  }

  // Mobile pagination helpers
  getCurrentPage(): number {
    return this.filtros().page || 1;
  }

  getTotalPages(): number {
    const limit = this.filtros().limit || 20;
    return Math.ceil(this.totalItems() / limit) || 1;
  }

  getPageRangeStart(): number {
    const page = this.getCurrentPage();
    const limit = this.filtros().limit || 20;
    return (page - 1) * limit + 1;
  }

  getPageRangeEnd(): number {
    const page = this.getCurrentPage();
    const limit = this.filtros().limit || 20;
    const end = page * limit;
    return Math.min(end, this.totalItems());
  }

  hasPreviousPage(): boolean {
    return this.getCurrentPage() > 1;
  }

  hasNextPage(): boolean {
    return this.getCurrentPage() < this.getTotalPages();
  }

  goToFirstPage(): void {
    this.filtros.update((f) => ({ ...f, page: 1 }));
    this.loadOrdens();
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.filtros.update((f) => ({ ...f, page: (f.page || 1) - 1 }));
      this.loadOrdens();
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.filtros.update((f) => ({ ...f, page: (f.page || 1) + 1 }));
      this.loadOrdens();
    }
  }

  goToLastPage(): void {
    this.filtros.update((f) => ({ ...f, page: this.getTotalPages() }));
    this.loadOrdens();
  }

  onPageInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let page = parseInt(input.value, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    } else if (page > this.getTotalPages()) {
      page = this.getTotalPages();
    }

    input.value = page.toString();
    this.filtros.update((f) => ({ ...f, page }));
    this.loadOrdens();
  }
}
