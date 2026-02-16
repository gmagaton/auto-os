import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  senha = '';
  loading = false;
  error = '';
  slug: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tenantService = inject(TenantService);

  constructor() {
    this.slug = this.route.snapshot.paramMap.get('slug');
  }

  login() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.senha, this.slug ?? undefined).subscribe({
      next: () => {
        if (this.authService.isSuperAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate([this.tenantService.route('/dashboard')]);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Email ou senha invalidos';
      },
    });
  }
}
