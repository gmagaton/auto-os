import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Fabricante, Modelo } from './fabricantes.service';

export interface ModeloFormData {
  modelo?: Modelo;
  fabricanteId?: string;
  fabricantes?: Fabricante[];
}

@Component({
  selector: 'app-modelo-form',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './modelo-form.component.html',
})
export class ModeloFormComponent {
  private readonly dialogRef = inject(MatDialogRef<ModeloFormComponent>);
  readonly data = inject<ModeloFormData>(MAT_DIALOG_DATA, { optional: true });

  nome = this.data?.modelo?.nome || '';
  fabricanteId = this.data?.fabricanteId || this.data?.modelo?.fabricante?.id || '';

  onCancel(): void {
    this.dialogRef.close();
  }

  isValid(): boolean {
    return this.nome.trim().length > 0 && this.fabricanteId.length > 0;
  }

  onSave(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        nome: this.nome.trim(),
        fabricanteId: this.fabricanteId,
      });
    }
  }
}
