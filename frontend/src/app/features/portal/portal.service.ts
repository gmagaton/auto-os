import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Servico {
  id: string;
  nome: string;
  tipo: string;
}

export interface ItemOrcamento {
  id: string;
  valor: number;
  servico: Servico;
}

export interface Foto {
  id: string;
  url: string;
  tipo: 'ENTRADA' | 'PROGRESSO' | 'FINAL';
  criadoEm: string;
}

export interface Modelo {
  id: string;
  nome: string;
  fabricante: {
    id: string;
    nome: string;
  };
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  cor: string;
  ano?: number;
  modelo: Modelo;
  cliente: Cliente;
}

export interface Ordem {
  id: string;
  token: string;
  status: 'AGUARDANDO' | 'APROVADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  valorTotal: number;
  dataAgendada?: string;
  aprovadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
  veiculo: Veiculo;
  itens: ItemOrcamento[];
  fotos: Foto[];
}

export interface ChecklistItem {
  item: {
    id: string;
    nome: string;
    categoria: string;
    ordem: number;
  };
  preenchido: {
    id: string;
    status: 'OK' | 'DEFEITO' | 'NAO_APLICA';
    observacao?: string;
    criadoEm: string;
    usuario: { id: string; nome: string };
  } | null;
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getOrdem(token: string): Observable<Ordem> {
    return this.http.get<Ordem>(`${this.apiUrl}/portal/${token}`);
  }

  aprovarOrdem(token: string, ordemId: string): Observable<Ordem> {
    return this.http.post<Ordem>(`${this.apiUrl}/portal/${token}/aprovar?ordemId=${ordemId}`, {});
  }

  getChecklist(token: string): Observable<ChecklistItem[]> {
    return this.http.get<ChecklistItem[]>(`${this.apiUrl}/portal/${token}/checklist`);
  }
}
