import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

export type StatusOS = 'AGUARDANDO' | 'APROVADO' | 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
export type TipoFoto = 'ENTRADA' | 'PROGRESSO' | 'FINAL';

export interface FiltroOrdens {
  status?: string[];
  inicio?: string;
  fim?: string;
  clienteId?: string;
  placa?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ItemOrcamento {
  id: string;
  valor: number;
  servico: {
    id: string;
    nome: string;
    tipo: 'SERVICO' | 'ADICIONAL';
    valor?: number;
  };
}

export interface Foto {
  id: string;
  url: string;
  tipo: TipoFoto;
  criadoEm: string;
}

export interface Ordem {
  id: string;
  token: string;
  status: StatusOS;
  valorTotal: number;
  dataAgendada?: string;
  aprovadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
  veiculo: {
    id: string;
    placa: string;
    cor: string;
    ano?: number;
    modelo: {
      id: string;
      nome: string;
      fabricante: {
        id: string;
        nome: string;
      };
    };
    cliente: {
      id: string;
      nome: string;
      telefone: string;
      email?: string;
    };
  };
  usuario: {
    id: string;
    nome: string;
    email?: string;
  };
  itens: ItemOrcamento[];
  fotos: Foto[];
}

export interface CreateOrdemPayload {
  veiculoId: string;
  dataAgendada?: string;
  itens: { servicoId: string; valor: number }[];
}

export interface UpdateOrdemPayload {
  status?: StatusOS;
  dataAgendada?: string;
  itens?: { servicoId: string; valor: number }[];
}

export interface CreateFotoPayload {
  url: string;
  tipo: TipoFoto;
}

@Injectable({ providedIn: 'root' })
export class OrdensService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAll(filtros?: FiltroOrdens): Observable<PaginatedResponse<Ordem>> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.status && filtros.status.length > 0) {
        params = params.set('status', filtros.status.join(','));
      }
      if (filtros.inicio) {
        params = params.set('inicio', filtros.inicio);
      }
      if (filtros.fim) {
        params = params.set('fim', filtros.fim);
      }
      if (filtros.clienteId) {
        params = params.set('clienteId', filtros.clienteId);
      }
      if (filtros.placa) {
        params = params.set('placa', filtros.placa);
      }
      if (filtros.page) {
        params = params.set('page', filtros.page.toString());
      }
      if (filtros.limit) {
        params = params.set('limit', filtros.limit.toString());
      }
    }

    return this.http.get<PaginatedResponse<Ordem>>(`${this.baseUrl}/ordens`, { params });
  }

  getById(id: string): Observable<Ordem> {
    return this.api.get<Ordem>(`ordens/${id}`);
  }

  create(data: CreateOrdemPayload): Observable<Ordem> {
    return this.api.post<Ordem>('ordens', data);
  }

  update(id: string, data: UpdateOrdemPayload): Observable<Ordem> {
    return this.api.put<Ordem>(`ordens/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`ordens/${id}`);
  }

  addFoto(ordemId: string, data: CreateFotoPayload): Observable<Foto> {
    return this.api.post<Foto>(`ordens/${ordemId}/fotos`, data);
  }

  removeFoto(ordemId: string, fotoId: string): Observable<void> {
    return this.api.delete<void>(`ordens/${ordemId}/fotos/${fotoId}`);
  }

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData);
  }

  getByPeriodo(inicio: string, fim: string): Observable<Ordem[]> {
    return this.api.get<Ordem[]>('ordens/agenda', { inicio, fim });
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/ordens/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  getHistorico(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ordens/${id}/historico`);
  }

  getChecklistStatus(id: string): Observable<{ preenchido: boolean; total: number; preenchidos: number }> {
    return this.http.get<{ preenchido: boolean; total: number; preenchidos: number }>(`${this.baseUrl}/checklist/ordem/${id}/status`);
  }
}
