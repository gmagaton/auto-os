import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ItemChecklist } from './checklist.service';

export interface ItemFormData {
  item?: ItemChecklist;
}

const CATEGORIAS = ['ELETRICA', 'CLIMATIZACAO', 'GERAL', 'APARENCIA'];

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './item-form.component.html',
})
export class ItemFormComponent {
  private readonly dialogRef = inject(MatDialogRef<ItemFormComponent>);
  readonly data = inject<ItemFormData>(MAT_DIALOG_DATA, { optional: true });

  categorias = CATEGORIAS;
  nome = this.data?.item?.nome || '';
  categoria = this.data?.item?.categoria || '';
  ordem = this.data?.item?.ordem || 1;

  onCancel(): void {
    this.dialogRef.close();
  }

  isValid(): boolean {
    return this.nome.trim().length > 0 && this.categoria.length > 0 && this.ordem > 0;
  }

  onSave(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        nome: this.nome.trim(),
        categoria: this.categoria,
        ordem: this.ordem,
      });
    }
  }
}
