import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { EmpresasAdminService, Plano } from './empresas.service';

export interface AssinaturaDialogData {
  empresaId: string;
  assinaturaAtual?: { plano?: { id: string; nome: string }; status: string };
}

@Component({
  selector: 'app-assinatura-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.assinaturaAtual ? 'Renovar / Trocar Plano' : 'Atribuir Plano' }}</h2>
    <mat-dialog-content>
      @if (data.assinaturaAtual) {
        <p>Plano atual: <strong>{{ data.assinaturaAtual.plano?.nome }}</strong> ({{ data.assinaturaAtual.status }})</p>
      }

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Plano</mat-label>
        <mat-select [(ngModel)]="selectedPlanoId">
          @for (p of planos(); track p.id) {
            <mat-option [value]="p.id">{{ p.nome }} — {{ p.preco | currency:'BRL':'symbol':'1.0-0' }}/mes</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Meses</mat-label>
        <input matInput type="number" [(ngModel)]="meses" min="1">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="confirmar()" [disabled]="saving() || !selectedPlanoId">
        @if (saving()) { <mat-spinner diameter="20" /> }
        @else { Confirmar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 320px; }
  `],
})
export class AssinaturaDialogComponent implements OnInit {
  readonly data = inject<AssinaturaDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AssinaturaDialogComponent>);
  private readonly empresasService = inject(EmpresasAdminService);

  planos = signal<Plano[]>([]);
  saving = signal(false);
  selectedPlanoId = '';
  meses = 1;

  ngOnInit(): void {
    this.empresasService.getPlanos().subscribe({
      next: (planos) => this.planos.set(planos),
    });
  }

  confirmar(): void {
    if (!this.selectedPlanoId) return;
    this.saving.set(true);
    this.empresasService.criarAssinatura(this.data.empresaId, this.selectedPlanoId, this.meses).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.saving.set(false),
    });
  }
}
