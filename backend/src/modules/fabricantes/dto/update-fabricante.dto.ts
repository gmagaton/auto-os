import { IsOptional, MinLength, IsBoolean } from 'class-validator';

export class UpdateFabricanteDto {
  @IsOptional()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
