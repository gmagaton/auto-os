import { IsOptional, IsInt, Min, Max, Length } from 'class-validator';

export class UpdateVeiculoDto {
  @IsOptional()
  @Length(7, 8, { message: 'Placa deve ter entre 7 e 8 caracteres' })
  placa?: string;

  @IsOptional()
  cor?: string;

  @IsOptional()
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(1900, { message: 'Ano deve ser maior ou igual a 1900' })
  @Max(2100, { message: 'Ano deve ser menor ou igual a 2100' })
  ano?: number;

  @IsOptional()
  modeloId?: string;

  @IsOptional()
  clienteId?: string;
}
