import { Injectable, signal, computed } from '@angular/core';

export interface Empresa {
  id: string;
  slug: string;
  nome: string;
  logoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly empresaSignal = signal<Empresa | null>(null);

  readonly empresa = this.empresaSignal.asReadonly();
  readonly slug = computed(() => this.empresaSignal()?.slug || '');

  constructor() {
    // Clean up old localStorage key (migration)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('empresa');
    }
  }

  setEmpresa(empresa: Empresa): void {
    this.empresaSignal.set(empresa);
  }

  clear(): void {
    this.empresaSignal.set(null);
  }

  route(path: string): string {
    return `/${this.slug()}${path.startsWith('/') ? path : '/' + path}`;
  }
}
