import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cadastro.component.html',
})
export class CadastroComponent {
  nomeEmpresa = '';
  slug = '';
  nomeAdmin = '';
  email = '';
  senha = '';
  loading = false;
  error = '';
  slugDisponivel: boolean | null = null;
  verificandoSlug = false;

  private api = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private slugCheck$ = new Subject<string>();

  constructor() {
    this.slugCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(slug => {
        this.verificandoSlug = true;
        return this.api.get<{ disponivel: boolean }>(`auth/verificar-slug/${slug}`);
      }),
    ).subscribe({
      next: (res) => {
        this.slugDisponivel = res.disponivel;
        this.verificandoSlug = false;
      },
      error: () => {
        this.verificandoSlug = false;
      },
    });
  }

  onNomeEmpresaChange() {
    this.slug = this.generateSlug(this.nomeEmpresa);
    this.checkSlug();
  }

  onSlugChange() {
    this.checkSlug();
  }

  private checkSlug() {
    if (this.slug.length >= 2) {
      this.slugDisponivel = null;
      this.slugCheck$.next(this.slug);
    }
  }

  private generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  cadastrar() {
    this.loading = true;
    this.error = '';

    this.api.post<any>('auth/registro', {
      nomeEmpresa: this.nomeEmpresa,
      slug: this.slug,
      nomeAdmin: this.nomeAdmin,
      email: this.email,
      senha: this.senha,
    }).subscribe({
      next: (response) => {
        this.authService.handleLoginResponse(response);
        this.router.navigate([`/${this.slug}/dashboard`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erro ao criar conta. Tente novamente.';
      },
    });
  }
}
