import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Plano {
  id: string;
  nome: string;
  slug: string;
  maxUsuarios: number | null;
  preco: number;
  ativo: boolean;
}

export interface AssinaturaAtiva {
  id: string;
  status: string;
  dataFim: string;
  criadoEm: string;
  plano: Plano;
}

@Injectable({ providedIn: 'root' })
export class AssinaturaService {
  private readonly api = inject(ApiService);

  getMinhaAssinatura(): Observable<AssinaturaAtiva | null> {
    return this.api.get<AssinaturaAtiva | null>('assinatura');
  }

  getPlanos(): Observable<Plano[]> {
    return this.api.get<Plano[]>('assinatura/planos');
  }

  trocarPlano(planoId: string): Observable<any> {
    return this.api.post('assinatura/trocar-plano', { planoId });
  }
}
