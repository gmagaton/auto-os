import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsEnum(['ADMIN', 'ATENDENTE'], { message: 'Papel inválido' })
  papel: 'ADMIN' | 'ATENDENTE';
}
