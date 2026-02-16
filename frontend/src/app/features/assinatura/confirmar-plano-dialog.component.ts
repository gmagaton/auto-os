import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';
import { Plano } from './assinatura.service';

@Component({
  selector: 'app-confirmar-plano-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe],
  template: `
    <h2 mat-dialog-title>Confirmar Troca de Plano</h2>
    <mat-dialog-content>
      <p>Deseja trocar para o plano <strong>{{ data.plano.nome }}</strong>?</p>
      <p>Valor: <strong>{{ data.plano.preco | currency:'BRL':'symbol':'1.2-2' }}/mes</strong></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Confirmar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarPlanoDialogComponent {
  readonly data = inject<{ plano: Plano }>(MAT_DIALOG_DATA);
}
