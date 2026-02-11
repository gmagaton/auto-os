import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Servico {
  id: string;
  nome: string;
  tipo: 'SERVICO' | 'ADICIONAL';
  valor: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly api = inject(ApiService);

  getAll(tipo?: string): Observable<Servico[]> {
    return this.api.get<Servico[]>('servicos', tipo ? { tipo } : undefined);
  }

  getById(id: string): Observable<Servico> {
    return this.api.get<Servico>(`servicos/${id}`);
  }

  create(data: Partial<Servico>): Observable<Servico> {
    return this.api.post<Servico>('servicos', data);
  }

  update(id: string, data: Partial<Servico>): Observable<Servico> {
    return this.api.put<Servico>(`servicos/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`servicos/${id}`);
  }
}
