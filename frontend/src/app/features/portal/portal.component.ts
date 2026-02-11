import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { PortalService, Ordem, Foto, ChecklistItem } from './portal.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
  ],
  templateUrl: './portal.component.html',
})
export class PortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly portalService = inject(PortalService);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);

  ordem = signal<Ordem | null>(null);
  checklist = signal<ChecklistItem[]>([]);
  loading = signal(true);
  error = signal(false);
  aprovando = signal(false);

  itemColumns = ['servico', 'tipo', 'valor'];

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.loadOrdem(token);
    } else {
      this.error.set(true);
      this.loading.set(false);
    }
  }

  loadOrdem(token: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.portalService.getOrdem(token).subscribe({
      next: (ordem) => {
        this.ordem.set(ordem);
        this.loading.set(false);
        this.loadChecklist(token);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  loadChecklist(token: string): void {
    this.portalService.getChecklist(token).subscribe({
      next: (checklist) => {
        this.checklist.set(checklist);
      },
      error: () => {
        // Silent fail - checklist is optional
      },
    });
  }

  getChecklistCategorias(): string[] {
    const categorias = [...new Set(this.checklist().map(c => c.item.categoria))];
    return categorias.sort();
  }

  getChecklistByCategoria(categoria: string): ChecklistItem[] {
    return this.checklist().filter(c => c.item.categoria === categoria);
  }

  getChecklistIcon(status: string | undefined): string {
    switch (status) {
      case 'OK':
        return 'check_circle';
      case 'DEFEITO':
        return 'warning';
      case 'NAO_APLICA':
        return 'remove_circle';
      default:
        return 'radio_button_unchecked';
    }
  }

  getChecklistStatusClass(status: string | undefined): string {
    switch (status) {
      case 'OK':
        return 'status-ok';
      case 'DEFEITO':
        return 'status-defeito';
      case 'NAO_APLICA':
        return 'status-na';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      AGUARDANDO: 'Aguardando Aprovacao',
      APROVADO: 'Orcamento Aprovado',
      AGENDADO: 'Servico Agendado',
      EM_ANDAMENTO: 'Servico em Andamento',
      FINALIZADO: 'Servico Finalizado',
      CANCELADO: 'Orcamento Cancelado',
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      AGUARDANDO: 'hourglass_empty',
      APROVADO: 'thumb_up',
      AGENDADO: 'event',
      EM_ANDAMENTO: 'build',
      FINALIZADO: 'check_circle',
      CANCELADO: 'cancel',
    };
    return icons[status] || 'help';
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      AGUARDANDO: 'Analise os itens do orcamento e clique em "Aprovar" para dar continuidade ao servico.',
      APROVADO: 'Seu orcamento foi aprovado! Em breve entraremos em contato para agendar o servico.',
      AGENDADO: 'Seu servico esta agendado. Aguarde a data combinada para trazer o veiculo.',
      EM_ANDAMENTO: 'Seu veiculo esta em manutencao. Acompanhe o progresso na galeria de fotos.',
      FINALIZADO: 'O servico foi concluido com sucesso! Seu veiculo esta pronto para retirada.',
      CANCELADO: 'Este orcamento foi cancelado. Entre em contato conosco para mais informacoes.',
    };
    return descriptions[status] || '';
  }

  hasPreenchidos(): boolean {
    return this.checklist().some(c => c.preenchido !== null && c.preenchido !== undefined);
  }

  abrirFoto(url: string): void {
    window.open(url, '_blank');
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

  getFotosByTipo(tipo: 'ENTRADA' | 'PROGRESSO' | 'FINAL'): Foto[] {
    const ordem = this.ordem();
    if (!ordem || !ordem.fotos) return [];
    return ordem.fotos.filter((f) => f.tipo === tipo);
  }

  confirmarAprovacao(): void {
    this.dialogService.confirm({
      title: 'Aprovar Orcamento',
      message: 'Tem certeza que deseja aprovar este orcamento?',
      confirmText: 'Aprovar',
      cancelText: 'Cancelar',
      type: 'warning',
      icon: 'thumb_up',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.aprovarOrdem();
      }
    });
  }

  aprovarOrdem(): void {
    const ordem = this.ordem();
    if (!ordem) return;

    this.aprovando.set(true);

    this.portalService.aprovarOrdem(ordem.token, ordem.id).subscribe({
      next: () => {
        this.snackBar.open('Orcamento aprovado com sucesso!', 'Fechar', {
          duration: 5000,
        });
        // Reload the ordem to get updated status
        this.loadOrdem(ordem.token);
        this.aprovando.set(false);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erro ao aprovar orcamento',
          'Fechar',
          { duration: 5000 }
        );
        this.aprovando.set(false);
      },
    });
  }
}
