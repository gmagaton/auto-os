import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Veiculo {
  id: string;
  placa: string;
  cor: string;
  ano?: number;
  clienteId: string;
  modeloId: string;
  criadoEm: string;
  atualizadoEm: string;
  cliente?: {
    id: string;
    nome: string;
  };
  modelo?: {
    id: string;
    nome: string;
    fabricante: {
      id: string;
      nome: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class VeiculosService {
  private readonly api = inject(ApiService);

  getAll(params?: Record<string, string | number | boolean>): Observable<Veiculo[]> {
    return this.api.get<Veiculo[]>('veiculos', params);
  }

  getById(id: string): Observable<Veiculo> {
    return this.api.get<Veiculo>(`veiculos/${id}`);
  }

  create(data: Partial<Veiculo>): Observable<Veiculo> {
    return this.api.post<Veiculo>('veiculos', data);
  }

  update(id: string, data: Partial<Veiculo>): Observable<Veiculo> {
    return this.api.put<Veiculo>(`veiculos/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`veiculos/${id}`);
  }
}
