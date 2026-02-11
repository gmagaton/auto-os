import {
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'ATENDENTE'], { message: 'Papel inválido' })
  papel?: 'ADMIN' | 'ATENDENTE';

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
