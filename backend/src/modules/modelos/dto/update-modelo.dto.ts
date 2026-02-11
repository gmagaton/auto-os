import { IsOptional, MinLength, IsBoolean, IsString } from 'class-validator';

export class UpdateModeloDto {
  @IsOptional()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'ID do fabricante inválido' })
  fabricanteId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
