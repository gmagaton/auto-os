import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Servico, ServicosService } from './servicos.service';

export interface ServicoFormData {
  servico?: Servico;
}

@Component({
  selector: 'app-servico-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './servico-form.component.html',
})
export class ServicoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ServicoFormComponent>);
  private readonly servicosService = inject(ServicosService);
  readonly data = inject<ServicoFormData>(MAT_DIALOG_DATA, { optional: true });

  loading = signal(false);
  error = signal('');

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nome: [this.data?.servico?.nome ?? '', Validators.required],
      tipo: [this.data?.servico?.tipo ?? 'SERVICO', Validators.required],
      valor: [this.data?.servico?.valor ?? 0, [Validators.required, Validators.min(0)]],
      ativo: [this.data?.servico?.ativo ?? true],
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
    const payload: Partial<Servico> = {
      nome: formValue.nome,
      tipo: formValue.tipo,
      valor: Number(formValue.valor),
      ativo: formValue.ativo,
    };

    const request$ = this.data?.servico
      ? this.servicosService.update(this.data.servico.id, payload)
      : this.servicosService.create(payload);

    request$.subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar servico');
      },
    });
  }
}
