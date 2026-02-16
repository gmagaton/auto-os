import { Component, inject, signal, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { AssinaturaService, AssinaturaAtiva, Plano } from './assinatura.service';
import { ConfirmarPlanoDialogComponent } from './confirmar-plano-dialog.component';

@Component({
  selector: 'app-assinatura',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDialogModule, DatePipe, CurrencyPipe,
  ],
  templateUrl: './assinatura.component.html',
  styles: [`
    .planos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .plano-card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: box-shadow 0.2s;
    }
    .plano-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .plano-atual { border-color: #1976d2; background: #e3f2fd; }
    .plano-card h4 { margin: 0 0 8px; font-size: 18px; }
    .plano-preco { font-size: 24px; font-weight: 700; color: #1976d2; }
    .plano-preco span { font-size: 14px; font-weight: 400; color: #666; }
    .plano-detalhe { color: #666; font-size: 14px; margin: 8px 0 16px; }
    .empty-text { color: #666; font-style: italic; }
  `],
})
export class AssinaturaComponent implements OnInit {
  private readonly assinaturaService = inject(AssinaturaService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  assinatura = signal<AssinaturaAtiva | null>(null);
  planos = signal<Plano[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.assinaturaService.getMinhaAssinatura().subscribe({
      next: (a) => {
        this.assinatura.set(a);
        this.assinaturaService.getPlanos().subscribe({
          next: (planos) => {
            this.planos.set(planos);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  selecionarPlano(plano: Plano): void {
    const ref = this.dialog.open(ConfirmarPlanoDialogComponent, {
      data: { plano },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.assinaturaService.trocarPlano(plano.id).subscribe({
          next: () => this.loadData(),
        });
      }
    });
  }
}
