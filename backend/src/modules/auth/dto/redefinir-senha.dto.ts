import { IsString, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @IsString()
  token: string;

  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  novaSenha: string;
}
