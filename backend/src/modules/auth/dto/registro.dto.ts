import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  nomeEmpresa: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  nomeAdmin: string;

  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;
}
