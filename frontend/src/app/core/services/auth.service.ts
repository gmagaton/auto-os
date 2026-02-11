import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, LoginResponse } from '../models/usuario.model';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'usuario';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly usuarioSignal = signal<Usuario | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();

  readonly isLoggedIn = computed(() => !!this.tokenSignal() && !!this.usuarioSignal());
  readonly isAdmin = computed(() => this.usuarioSignal()?.papel === 'ADMIN');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const usuarioJson = localStorage.getItem(USER_KEY);

    if (token && usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson) as Usuario;
        this.tokenSignal.set(token);
        this.usuarioSignal.set(usuario);
      } catch {
        this.clearStorage();
      }
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { email, senha }).pipe(
      tap((response) => {
        this.tokenSignal.set(response.access_token);
        this.usuarioSignal.set(response.usuario);
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.usuarioSignal.set(null);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
