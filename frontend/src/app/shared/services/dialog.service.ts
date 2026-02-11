import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '400px',
      disableClose: true,
    });
    return dialogRef.afterClosed();
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar Exclusao',
      message: `Deseja realmente excluir "${itemName}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_outline',
    });
  }

  confirmAction(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'warning',
    });
  }
}
