import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardOperacional {
  aguardando: number;
  aprovado: number;
  emAndamento: number;
  hoje: number;
}

export interface FaturamentoMensal {
  mes: string;
  total: number;
}

export interface ServicoTop {
  nome: string;
  quantidade: number;
}

export interface DashboardData {
  operacional: DashboardOperacional;
  faturamento: FaturamentoMensal[];
  servicosTop: ServicoTop[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }
}
