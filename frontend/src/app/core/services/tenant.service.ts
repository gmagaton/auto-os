import { Injectable, signal, computed } from '@angular/core';

export interface Empresa {
  id: string;
  slug: string;
  nome: string;
  logoUrl?: string;
}

const EMPRESA_KEY = 'empresa';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly empresaSignal = signal<Empresa | null>(null);

  readonly empresa = this.empresaSignal.asReadonly();
  readonly slug = computed(() => this.empresaSignal()?.slug || '');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    const json = localStorage.getItem(EMPRESA_KEY);
    if (json) {
      try {
        this.empresaSignal.set(JSON.parse(json));
      } catch {
        localStorage.removeItem(EMPRESA_KEY);
      }
    }
  }

  setEmpresa(empresa: Empresa): void {
    this.empresaSignal.set(empresa);
    localStorage.setItem(EMPRESA_KEY, JSON.stringify(empresa));
  }

  clear(): void {
    this.empresaSignal.set(null);
    localStorage.removeItem(EMPRESA_KEY);
  }

  route(path: string): string {
    return `/${this.slug()}${path.startsWith('/') ? path : '/' + path}`;
  }
}
