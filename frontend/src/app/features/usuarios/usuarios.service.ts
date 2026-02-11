import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Usuario } from '../../core/models/usuario.model';

export interface CreateUsuarioDto {
  nome: string;
  email: string;
  senha: string;
  papel: 'ADMIN' | 'ATENDENTE';
  ativo?: boolean;
}

export interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: 'ADMIN' | 'ATENDENTE';
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('usuarios');
  }

  getById(id: string): Observable<Usuario> {
    return this.api.get<Usuario>(`usuarios/${id}`);
  }

  create(data: CreateUsuarioDto): Observable<Usuario> {
    return this.api.post<Usuario>('usuarios', data);
  }

  update(id: string, data: UpdateUsuarioDto): Observable<Usuario> {
    return this.api.put<Usuario>(`usuarios/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`usuarios/${id}`);
  }
}
