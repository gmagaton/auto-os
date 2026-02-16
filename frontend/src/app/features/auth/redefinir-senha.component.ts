import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './redefinir-senha.component.html',
})
export class RedefinirSenhaComponent {
  novaSenha = '';
  confirmarSenha = '';
  loading = false;
  error = '';
  sucesso = false;
  token: string;
  slug: string;

  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
  }

  redefinir() {
    if (this.novaSenha !== this.confirmarSenha) {
      this.error = 'As senhas nao coincidem';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.post<any>('auth/redefinir-senha', {
      token: this.token,
      novaSenha: this.novaSenha,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.sucesso = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erro ao redefinir senha';
      },
    });
  }

  irParaLogin() {
    if (this.slug) {
      this.router.navigate([`/${this.slug}/login`]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
