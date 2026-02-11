import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Usuario } from '../../core/models/usuario.model';
import { UsuariosService } from './usuarios.service';

export interface UsuarioFormData {
  usuario?: Usuario;
}

@Component({
  selector: 'app-usuario-form',
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
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UsuarioFormComponent>);
  private readonly usuariosService = inject(UsuariosService);
  readonly data = inject<UsuarioFormData>(MAT_DIALOG_DATA);

  loading = signal(false);
  error = signal('');

  form: FormGroup;

  constructor() {
    const isEdit = !!this.data.usuario;

    this.form = this.fb.group({
      nome: [this.data.usuario?.nome ?? '', Validators.required],
      email: [this.data.usuario?.email ?? '', [Validators.required, Validators.email]],
      senha: ['', isEdit ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      papel: [this.data.usuario?.papel ?? 'ATENDENTE', Validators.required],
      ativo: [this.data.usuario?.ativo ?? true],
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
      email: formValue.email,
      papel: formValue.papel,
      ativo: formValue.ativo,
    };

    // Only include senha if provided
    if (formValue.senha) {
      payload['senha'] = formValue.senha;
    }

    const request$ = this.data.usuario
      ? this.usuariosService.update(this.data.usuario.id, payload)
      : this.usuariosService.create(payload as never);

    request$.subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar usuario');
      },
    });
  }
}
