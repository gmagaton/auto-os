export interface Empresa {
  id: string;
  slug: string;
  nome: string;
  logoUrl?: string;
}

export type Papel = 'SUPERADMIN' | 'ADMIN' | 'ATENDENTE';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  empresaId?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
  empresa: Empresa | null;
}
