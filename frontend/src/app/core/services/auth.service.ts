import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TenantService, Empresa } from './tenant.service';
import { Usuario, LoginResponse } from '../models/usuario.model';

const SESSIONS_KEY = 'sessions';
const ADMIN_SLUG = '__admin__';

interface Session {
  token: string;
  usuario: Usuario;
  empresa: Empresa;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly tenantService = inject(TenantService);

  private readonly sessionsMap = signal<Record<string, Session>>({});
  private readonly activeSlugSignal = signal<string>('');

  readonly usuario = computed(() => {
    const session = this.getActiveSession();
    return session?.usuario ?? null;
  });

  readonly token = computed(() => {
    const session = this.getActiveSession();
    return session?.token ?? null;
  });

  readonly isLoggedIn = computed(() => !!this.token() && !!this.usuario());
  readonly isSuperAdmin = computed(() => this.usuario()?.papel === 'SUPERADMIN');
  readonly isAdmin = computed(() => {
    const papel = this.usuario()?.papel;
    return papel === 'ADMIN' || papel === 'SUPERADMIN';
  });

  constructor() {
    this.loadFromStorage();
  }

  private getActiveSession(): Session | null {
    const slug = this.activeSlugSignal();
    if (!slug) return null;
    return this.sessionsMap()[slug] ?? null;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    // Clean up old single-session keys (migration)
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');

    const json = localStorage.getItem(SESSIONS_KEY);
    if (!json) return;

    try {
      this.sessionsMap.set(JSON.parse(json) as Record<string, Session>);
    } catch {
      localStorage.removeItem(SESSIONS_KEY);
    }
    // Active session is NOT restored here.
    // The route guards (tenantGuard / superAdminGuard) will activate
    // the correct session based on the URL, keeping each tab independent.
  }

  private saveSessions(): void {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessionsMap()));
  }

  getToken(): string | null {
    return this.token();
  }

  /**
   * Check if there is a stored session for a given slug.
   */
  getSessionForSlug(slug: string): Session | null {
    return this.sessionsMap()[slug] ?? null;
  }

  /**
   * Activate the session for the given slug, updating
   * the active signals and tenant service.
   */
  activateSession(slug: string): boolean {
    const session = this.sessionsMap()[slug];
    if (!session) return false;

    this.activeSlugSignal.set(slug);
    this.tenantService.setEmpresa(session.empresa);
    return true;
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { email, senha }).pipe(
      tap((response) => {
        const isSuperAdmin = response.usuario.papel === 'SUPERADMIN';
        const slug = isSuperAdmin ? ADMIN_SLUG : response.empresa?.slug;

        if (!slug || !response.empresa) return;

        const session: Session = {
          token: response.access_token,
          usuario: response.usuario,
          empresa: response.empresa,
        };

        this.sessionsMap.update((map) => ({ ...map, [slug]: session }));
        this.saveSessions();

        this.activeSlugSignal.set(slug);
        this.tenantService.setEmpresa(response.empresa);
      })
    );
  }

  /**
   * Logout the current active session only.
   */
  logout(): void {
    const slug = this.activeSlugSignal();

    if (slug) {
      this.sessionsMap.update((map) => {
        const copy = { ...map };
        delete copy[slug];
        return copy;
      });
      this.saveSessions();
    }

    this.activeSlugSignal.set('');
    this.tenantService.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Check if there's any valid session at all.
   */
  hasAnySession(): boolean {
    return Object.keys(this.sessionsMap()).length > 0;
  }

  /**
   * Get the admin (SUPERADMIN) session if it exists.
   */
  getAdminSession(): Session | null {
    return this.sessionsMap()[ADMIN_SLUG] ?? null;
  }
}
