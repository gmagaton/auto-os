import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Cliente, ClientesService } from './clientes.service';

export interface ClienteFormData {
  cliente?: Cliente;
}

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
  templateUrl: './cliente-form.component.html',
})
export class ClienteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ClienteFormComponent>);
  private readonly clientesService = inject(ClientesService);
  readonly data = inject<ClienteFormData>(MAT_DIALOG_DATA, { optional: true });

  loading = signal(false);
  error = signal('');

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nome: [this.data?.cliente?.nome ?? '', Validators.required],
      telefone: [this.data?.cliente?.telefone ?? '', Validators.required],
      email: [this.data?.cliente?.email ?? '', Validators.email],
      documento: [this.data?.cliente?.documento ?? ''],
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const formValue = this.form.value;
    const payload: Record<string, unknown> = {
      nome: formValue.nome,
      telefone: formValue.telefone,
      email: formValue.email || null,
      documento: formValue.documento || null,
    };

    const request$ = this.data?.cliente
      ? this.clientesService.update(this.data.cliente.id, payload)
      : this.clientesService.create(payload);

    request$.subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar cliente');
      },
    });
  }
}
