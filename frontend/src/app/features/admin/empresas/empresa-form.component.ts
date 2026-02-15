import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmpresasAdminService } from './empresas.service';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="form-header">
      <button mat-icon-button routerLink="/admin/empresas">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ isEditing() ? 'Editar Empresa' : 'Nova Empresa' }}</h1>
    </div>

    <mat-card>
      <mat-card-content>
        <form (ngSubmit)="save()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome</mat-label>
            <input matInput [(ngModel)]="form.nome" name="nome" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Slug</mat-label>
            <input matInput [(ngModel)]="form.slug" name="slug" placeholder="auto-gerado se vazio">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput [(ngModel)]="form.email" name="email" type="email">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Telefone</mat-label>
            <input matInput [(ngModel)]="form.telefone" name="telefone">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Endereco</mat-label>
            <input matInput [(ngModel)]="form.endereco" name="endereco">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Plano</mat-label>
            <input matInput [(ngModel)]="form.plano" name="plano">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data de Vencimento</mat-label>
            <input matInput [(ngModel)]="form.dataVencimento" name="dataVencimento" type="date">
          </mat-form-field>

          <div class="form-actions">
            <button mat-stroked-button type="button" routerLink="/admin/empresas">Cancelar</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> }
              @else { Salvar }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .form-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
  `],
})
export class EmpresaFormComponent implements OnInit {
  private readonly empresasService = inject(EmpresasAdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEditing = signal(false);
  loading = signal(false);
  empresaId = '';
  error = '';

  form = {
    nome: '',
    slug: '',
    email: '',
    telefone: '',
    endereco: '',
    plano: '',
    dataVencimento: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.empresaId = id;
      this.empresasService.findOne(id).subscribe({
        next: (e) => {
          this.form = {
            nome: e.nome,
            slug: e.slug,
            email: e.email || '',
            telefone: e.telefone || '',
            endereco: e.endereco || '',
            plano: e.plano || '',
            dataVencimento: e.dataVencimento ? e.dataVencimento.split('T')[0] : '',
          };
        },
      });
    }
  }

  save(): void {
    this.loading.set(true);
    const dto = { ...this.form };
    if (!dto.slug) delete (dto as any).slug;
    if (!dto.dataVencimento) delete (dto as any).dataVencimento;

    const obs = this.isEditing()
      ? this.empresasService.update(this.empresaId, dto)
      : this.empresasService.create(dto);

    obs.subscribe({
      next: () => this.router.navigate(['/admin/empresas']),
      error: (err) => {
        this.loading.set(false);
        this.error = err.error?.message || 'Erro ao salvar';
      },
    });
  }
}
