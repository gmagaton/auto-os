export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMIN' | 'ATENDENTE';
  ativo: boolean;
  criadoEm: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
}
