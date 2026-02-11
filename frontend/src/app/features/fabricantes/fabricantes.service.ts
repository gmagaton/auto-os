import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Fabricante {
  id: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  modelos?: Modelo[];
}

export interface Modelo {
  id: string;
  nome: string;
  fabricanteId?: string;
  criadoEm: string;
  atualizadoEm?: string;
  ativo?: boolean;
  fabricante?: {
    id: string;
    nome: string;
  };
}

@Injectable({ providedIn: 'root' })
export class FabricantesService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Fabricante[]> {
    return this.api.get<Fabricante[]>('fabricantes');
  }

  getById(id: string): Observable<Fabricante> {
    return this.api.get<Fabricante>(`fabricantes/${id}`);
  }

  create(data: Partial<Fabricante>): Observable<Fabricante> {
    return this.api.post<Fabricante>('fabricantes', data);
  }

  update(id: string, data: Partial<Fabricante>): Observable<Fabricante> {
    return this.api.put<Fabricante>(`fabricantes/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`fabricantes/${id}`);
  }

  // Modelos
  getModelos(fabricanteId?: string): Observable<Modelo[]> {
    return this.api.get<Modelo[]>('modelos', fabricanteId ? { fabricanteId } : undefined);
  }

  createModelo(data: Partial<Modelo>): Observable<Modelo> {
    return this.api.post<Modelo>('modelos', data);
  }

  updateModelo(id: string, data: Partial<Modelo>): Observable<Modelo> {
    return this.api.put<Modelo>(`modelos/${id}`, data);
  }

  deleteModelo(id: string): Observable<void> {
    return this.api.delete<void>(`modelos/${id}`);
  }
}
