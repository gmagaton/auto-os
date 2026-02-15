import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { Ordem, OrdensService, StatusOS, TipoFoto, Foto } from './ordens.service';
import { ChecklistPreencherComponent } from './checklist-preencher.component';
import { DialogService } from '../../shared/services/dialog.service';
import { environment } from '../../../environments/environment';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-ordem-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ChecklistPreencherComponent,
  ],
  templateUrl: './ordem-detail.component.html',
})
export class OrdemDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordensService = inject(OrdensService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  public readonly tenantService = inject(TenantService);

  ordem = signal<Ordem | null>(null);
  loading = signal(true);
  historico = signal<any[]>([]);
  downloadingPdf = signal(false);
  itemColumns = ['nome', 'tipo', 'valor'];

  // Get current API base URL for photo URLs
  private readonly apiBaseUrl = environment.apiUrl.replace('/api', '');

  // Computed: pode editar dados/itens apenas em status AGUARDANDO
  podeEditar(): boolean {
    const status = this.ordem()?.status;
    return status === 'AGUARDANDO';
  }

  // Computed: pode editar checklist durante AGENDADO ou EM_ANDAMENTO
  podeEditarChecklist(): boolean {
    const status = this.ordem()?.status;
    return status === 'AGENDADO' || status === 'EM_ANDAMENTO';
  }

  // Computed: pode adicionar fotos
  podeAdicionarFoto(): boolean {
    const status = this.ordem()?.status;
    return status !== undefined && status !== 'CANCELADO';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrdem(id);
    }
  }

  loadOrdem(id: string): void {
    this.loading.set(true);
    this.ordensService.getById(id).subscribe({
      next: (ordem) => {
        this.ordem.set(ordem);
        this.loading.set(false);
        this.loadHistorico(id);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar ordem', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  loadHistorico(id: string): void {
    this.ordensService.getHistorico(id).subscribe({
      next: (data) => this.historico.set(data),
      error: () => {},
    });
  }

  downloadPdf(): void {
    this.downloadingPdf.set(true);
    this.ordensService.downloadPdf(this.ordem()!.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orcamento-${this.ordem()!.token.slice(-6)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingPdf.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao gerar PDF', 'Fechar', { duration: 3000 });
        this.downloadingPdf.set(false);
      },
    });
  }

  getHistoricoStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      AGUARDANDO: 'Aguardando',
      APROVADO: 'Aprovado',
      AGENDADO: 'Agendado',
      EM_ANDAMENTO: 'Em Andamento',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };
    return labels[status] || status;
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

  getFotosByTipo(tipo: TipoFoto): Foto[] {
    return this.ordem()?.fotos.filter((f) => f.tipo === tipo) || [];
  }

  // Fix photo URL to use current hostname instead of localhost
  getPhotoUrl(url: string): string {
    if (!url) return '';
    // If URL starts with http://localhost, replace with current API base
    if (url.startsWith('http://localhost')) {
      const path = url.replace(/^http:\/\/localhost:\d+/, '');
      return `${this.apiBaseUrl}${path}`;
    }
    return url;
  }

  copiarLinkCliente(): void {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/portal/${this.ordem()!.token}`;
    this.clipboard.copy(link);
    this.snackBar.open('Link do cliente copiado!', 'Fechar', { duration: 3000 });
  }

  mudarStatus(novoStatus: StatusOS): void {
    this.ordensService.update(this.ordem()!.id, { status: novoStatus }).subscribe({
      next: (ordem) => {
        this.ordem.set(ordem);
        this.snackBar.open('Status atualizado com sucesso', 'Fechar', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erro ao atualizar status', 'Fechar', { duration: 3000 });
      },
    });
  }

  // Flow for starting service - check if vehicle is in shop and require checklist
  iniciarServico(): void {
    const dialogRef = this.dialog.open(VeiculoNaLojaDialogComponent, {
      width: '400px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: 'sim' | 'nao' | undefined) => {
      if (result === 'nao') {
        this.snackBar.open('O veiculo deve estar na loja para iniciar o servico', 'Fechar', { duration: 4000 });
        return;
      }

      if (result === 'sim') {
        // Check if checklist is filled
        this.ordensService.getChecklistStatus(this.ordem()!.id).subscribe({
          next: (status) => {
            if (!status.preenchido) {
              this.snackBar.open('Preencha o checklist antes de iniciar o servico', 'Fechar', { duration: 4000 });
              // Navigate to checklist tab (index 3)
              // The user needs to fill the checklist first
            } else {
              this.mudarStatus('EM_ANDAMENTO');
            }
          },
          error: () => {
            // If error checking, allow to proceed but warn
            this.dialogService.confirm({
              title: 'Checklist',
              message: 'Nao foi possivel verificar o checklist. Deseja iniciar mesmo assim?',
              confirmText: 'Iniciar',
              cancelText: 'Cancelar',
              type: 'warning',
            }).subscribe((confirmed) => {
              if (confirmed) {
                this.mudarStatus('EM_ANDAMENTO');
              }
            });
          },
        });
      }
    });
  }

  abrirDialogAgendar(): void {
    const dialogRef = this.dialog.open(AgendarDialogComponent, {
      width: '350px',
      data: { dataAtual: this.ordem()?.dataAgendada },
    });

    dialogRef.afterClosed().subscribe((data: string | undefined) => {
      if (data) {
        this.ordensService.update(this.ordem()!.id, { status: 'AGENDADO', dataAgendada: data }).subscribe({
          next: (ordem) => {
            this.ordem.set(ordem);
            this.snackBar.open('Ordem agendada com sucesso', 'Fechar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erro ao agendar ordem', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  abrirDialogUpload(): void {
    const dialogRef = this.dialog.open(UploadFotoDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result: { file: File; tipo: TipoFoto } | undefined) => {
      if (result) {
        this.uploadFoto(result.file, result.tipo);
      }
    });
  }

  private uploadFoto(file: File, tipo: TipoFoto): void {
    this.snackBar.open('Enviando foto...', undefined, { duration: 0 });

    this.ordensService.uploadFile(file).subscribe({
      next: (response) => {
        this.ordensService.addFoto(this.ordem()!.id, { url: response.url, tipo }).subscribe({
          next: (foto) => {
            const ordem = this.ordem()!;
            this.ordem.set({ ...ordem, fotos: [...ordem.fotos, foto] });
            this.snackBar.open('Foto adicionada com sucesso', 'Fechar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erro ao adicionar foto', 'Fechar', { duration: 3000 });
          },
        });
      },
      error: () => {
        this.snackBar.open('Erro ao fazer upload da foto', 'Fechar', { duration: 3000 });
      },
    });
  }

  removerFoto(foto: Foto): void {
    this.dialogService.confirm({
      title: 'Remover Foto',
      message: 'Deseja realmente remover esta foto?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.ordensService.removeFoto(this.ordem()!.id, foto.id).subscribe({
          next: () => {
            const ordem = this.ordem()!;
            this.ordem.set({ ...ordem, fotos: ordem.fotos.filter((f) => f.id !== foto.id) });
            this.snackBar.open('Foto removida com sucesso', 'Fechar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erro ao remover foto', 'Fechar', { duration: 3000 });
          },
        });
      }
    });
  }

  abrirFoto(url: string): void {
    window.open(url, '_blank');
  }
}

// Agendar Dialog Component
@Component({
  selector: 'app-agendar-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Agendar Data</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Data</mat-label>
        <input matInput type="date" [(ngModel)]="data" [min]="minDate" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!data" (click)="confirmar()">Confirmar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `],
})
export class AgendarDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AgendarDialogComponent>);
  readonly injectedData = inject<{ dataAtual?: string }>(MAT_DIALOG_DATA, { optional: true });

  data = this.injectedData?.dataAtual?.split('T')[0] || '';
  minDate = new Date().toISOString().split('T')[0];

  confirmar(): void {
    if (this.data) {
      this.dialogRef.close(this.data);
    }
  }
}

// Upload Foto Dialog Component
@Component({
  selector: 'app-upload-foto-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Adicionar Foto</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tipo de Foto</mat-label>
        <mat-select [(ngModel)]="tipo">
          <mat-option value="ENTRADA">Entrada</mat-option>
          <mat-option value="PROGRESSO">Progresso</mat-option>
          <mat-option value="FINAL">Final</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="file-input">
        <input type="file" accept="image/*" (change)="onFileSelected($event)" #fileInput hidden />
        <button mat-stroked-button type="button" (click)="fileInput.click()">
          <mat-icon>cloud_upload</mat-icon>
          Selecionar Imagem
        </button>
        @if (selectedFile) {
          <span class="file-name">{{ selectedFile.name }}</span>
        }
      </div>

      @if (preview) {
        <div class="preview">
          <img [src]="preview" alt="Preview" />
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!canUpload()" (click)="confirmar()">Enviar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    .file-input {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .file-name {
      font-size: 14px;
      color: #666;
    }
    .preview {
      margin-top: 16px;
    }
    .preview img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
    }
  `],
})
export class UploadFotoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UploadFotoDialogComponent>);

  tipo: TipoFoto = 'ENTRADA';
  selectedFile: File | null = null;
  preview: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.preview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  canUpload(): boolean {
    return !!this.selectedFile && !!this.tipo;
  }

  confirmar(): void {
    if (this.canUpload()) {
      this.dialogRef.close({ file: this.selectedFile, tipo: this.tipo });
    }
  }
}

// Veiculo na Loja Dialog Component
@Component({
  selector: 'app-veiculo-na-loja-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
  ],
  template: `
    <div class="veiculo-loja-dialog">
      <div class="dialog-icon">
        <mat-icon>directions_car</mat-icon>
      </div>
      <h2 mat-dialog-title>Iniciar Servico</h2>
      <mat-dialog-content>
        <p class="dialog-question">O veiculo esta na loja?</p>
        <mat-radio-group [(ngModel)]="resposta" class="radio-group">
          <mat-radio-button value="sim">Sim, o veiculo esta na loja</mat-radio-button>
          <mat-radio-button value="nao">Nao, o veiculo nao esta</mat-radio-button>
        </mat-radio-group>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-stroked-button mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" [disabled]="!resposta" (click)="confirmar()">
          Continuar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .veiculo-loja-dialog {
      text-align: center;
      padding: 8px 0;
    }

    .dialog-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #1976d2;
      }
    }

    h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
    }

    .dialog-question {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
    }

    mat-dialog-actions {
      margin-top: 16px;
      gap: 12px;
    }
  `],
})
export class VeiculoNaLojaDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<VeiculoNaLojaDialogComponent>);

  resposta: 'sim' | 'nao' | null = null;

  confirmar(): void {
    if (this.resposta) {
      this.dialogRef.close(this.resposta);
    }
  }
}
