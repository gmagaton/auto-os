import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Fabricante } from './fabricantes.service';

export interface FabricanteFormData {
  fabricante?: Fabricante;
}

@Component({
  selector: 'app-fabricante-form',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './fabricante-form.component.html',
})
export class FabricanteFormComponent {
  private readonly dialogRef = inject(MatDialogRef<FabricanteFormComponent>);
  readonly data = inject<FabricanteFormData>(MAT_DIALOG_DATA, { optional: true });

  nome = this.data?.fabricante?.nome || '';

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.nome.trim()) {
      this.dialogRef.close({ nome: this.nome.trim() });
    }
  }
}
