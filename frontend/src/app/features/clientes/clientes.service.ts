import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Veiculo {
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
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  documento?: string;
  criadoEm: string;
  veiculos?: Veiculo[];
  _count?: {
    veiculos: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly api = inject(ApiService);

  getAll(busca?: string): Observable<Cliente[]> {
    return this.api.get<Cliente[]>('clientes', busca ? { busca } : undefined);
  }

  getById(id: string): Observable<Cliente> {
    return this.api.get<Cliente>(`clientes/${id}`);
  }

  create(data: Partial<Cliente>): Observable<Cliente> {
    return this.api.post<Cliente>('clientes', data);
  }

  update(id: string, data: Partial<Cliente>): Observable<Cliente> {
    return this.api.put<Cliente>(`clientes/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`clientes/${id}`);
  }
}
