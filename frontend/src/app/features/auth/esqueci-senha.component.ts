import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-esqueci-senha',
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
  templateUrl: './esqueci-senha.component.html',
})
export class EsqueciSenhaComponent {
  email = '';
  loading = false;
  enviado = false;

  private api = inject(ApiService);

  enviar() {
    this.loading = true;

    this.api.post<any>('auth/esqueci-senha', { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.enviado = true;
      },
      error: () => {
        this.loading = false;
        this.enviado = true; // Show generic message even on error
      },
    });
  }
}
