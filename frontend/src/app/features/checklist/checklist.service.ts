import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface ItemChecklist {
  id: string;
  nome: string;
  categoria: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
}

export interface ChecklistPreenchido {
  item: ItemChecklist;
  preenchido: {
    id: string;
    status: StatusChecklist;
    observacao?: string;
    criadoEm: string;
    usuario: { id: string; nome: string };
  } | null;
}

export type StatusChecklist = 'OK' | 'DEFEITO' | 'NAO_APLICA';

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly api = inject(ApiService);

  // Config
  getItens(includeInactive = false): Observable<ItemChecklist[]> {
    return this.api.get<ItemChecklist[]>('checklist/itens', { includeInactive: String(includeInactive) });
  }

  createItem(data: Partial<ItemChecklist>): Observable<ItemChecklist> {
    return this.api.post<ItemChecklist>('checklist/itens', data);
  }

  updateItem(id: string, data: Partial<ItemChecklist>): Observable<ItemChecklist> {
    return this.api.put<ItemChecklist>(`checklist/itens/${id}`, data);
  }

  deleteItem(id: string): Observable<void> {
    return this.api.delete<void>(`checklist/itens/${id}`);
  }

  getCategorias(): Observable<string[]> {
    return this.api.get<string[]>('checklist/categorias');
  }

  // Preenchimento
  getByOrdem(ordemId: string): Observable<ChecklistPreenchido[]> {
    return this.api.get<ChecklistPreenchido[]>(`checklist/ordem/${ordemId}`);
  }

  preencherChecklist(ordemId: string, itens: Array<{ itemId: string; status: StatusChecklist; observacao?: string }>): Observable<any> {
    return this.api.post(`checklist/ordem/${ordemId}`, { itens });
  }
}
