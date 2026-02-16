import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface AssinaturaResumo {
  status: string;
  dataFim: string;
  plano: { nome: string };
}

export interface EmpresaListItem {
  id: string;
  nome: string;
  slug: string;
  status: 'ATIVA' | 'SUSPENSA' | 'CANCELADA';
  criadoEm: string;
  _count: { usuarios: number; clientes: number; ordens: number };
  assinaturas: AssinaturaResumo[];
}

export interface EmpresaDetail {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  status: 'ATIVA' | 'SUSPENSA' | 'CANCELADA';
  criadoEm: string;
  atualizadoEm: string;
  _count: { usuarios: number; clientes: number; veiculos: number; ordens: number; servicos: number };
  assinaturas: any[];
}

export interface EmpresaStats {
  usuarios: number;
  ordens: number;
  faturamento: number;
}

export interface Plano {
  id: string;
  nome: string;
  slug: string;
  maxUsuarios: number | null;
  preco: number;
  ativo: boolean;
}

export interface CreateEmpresaDto {
  nome: string;
  slug?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  logoUrl?: string;
  planoId?: string;
  meses?: number;
}

@Injectable({ providedIn: 'root' })
export class EmpresasAdminService {
  private readonly api = inject(ApiService);

  findAll(busca?: string): Observable<EmpresaListItem[]> {
    return this.api.get<EmpresaListItem[]>('empresas', busca ? { busca } : {});
  }

  findOne(id: string): Observable<EmpresaDetail> {
    return this.api.get<EmpresaDetail>(`empresas/${id}`);
  }

  getStats(id: string): Observable<EmpresaStats> {
    return this.api.get<EmpresaStats>(`empresas/${id}/stats`);
  }

  create(dto: CreateEmpresaDto): Observable<EmpresaDetail> {
    return this.api.post<EmpresaDetail>('empresas', dto);
  }

  update(id: string, dto: Partial<CreateEmpresaDto>): Observable<EmpresaDetail> {
    return this.api.put<EmpresaDetail>(`empresas/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<EmpresaDetail> {
    return this.api.patch<EmpresaDetail>(`empresas/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`empresas/${id}`);
  }

  getDashboardStats(): Observable<any> {
    return this.api.get<any>('empresas/dashboard');
  }

  getPlanos(): Observable<Plano[]> {
    return this.api.get<Plano[]>('planos');
  }

  criarAssinatura(empresaId: string, planoId: string, meses: number): Observable<any> {
    return this.api.post(`empresas/${empresaId}/assinatura`, { planoId, meses });
  }
}
