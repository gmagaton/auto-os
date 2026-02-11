import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog-header" [class]="'type-' + (data.type || 'warning')">
        <mat-icon>{{ data.icon || getDefaultIcon() }}</mat-icon>
      </div>
      <div class="confirm-dialog-content">
        <h2>{{ data.title }}</h2>
        <p>{{ data.message }}</p>
      </div>
      <div class="confirm-dialog-actions">
        <button mat-stroked-button (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-raised-button [color]="getButtonColor()" (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 0;
      min-width: 320px;
      max-width: 400px;
    }

    .confirm-dialog-header {
      display: flex;
      justify-content: center;
      padding: 24px;
      border-radius: 4px 4px 0 0;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      &.type-warning {
        background: rgba(255, 152, 0, 0.1);
        mat-icon { color: #ff9800; }
      }

      &.type-danger {
        background: rgba(244, 67, 54, 0.1);
        mat-icon { color: #f44336; }
      }

      &.type-info {
        background: rgba(33, 150, 243, 0.1);
        mat-icon { color: #2196f3; }
      }
    }

    .confirm-dialog-content {
      padding: 16px 24px;
      text-align: center;

      h2 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }

      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .confirm-dialog-actions {
      display: flex;
      gap: 12px;
      padding: 16px 24px 24px;
      justify-content: center;

      button {
        min-width: 100px;
      }
    }
  `],
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  getDefaultIcon(): string {
    switch (this.data.type) {
      case 'danger': return 'warning';
      case 'info': return 'info';
      default: return 'help_outline';
    }
  }

  getButtonColor(): string {
    return this.data.type === 'danger' ? 'warn' : 'primary';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
