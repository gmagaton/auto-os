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
  templateUrl: './empresa-form.component.html',
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
