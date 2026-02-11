import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateVeiculoDto {
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  @Length(7, 8, { message: 'Placa deve ter entre 7 e 8 caracteres' })
  placa: string;

  @IsNotEmpty({ message: 'Cor é obrigatória' })
  cor: string;

  @IsOptional()
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(1900, { message: 'Ano deve ser maior ou igual a 1900' })
  @Max(2100, { message: 'Ano deve ser menor ou igual a 2100' })
  ano?: number;

  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  modeloId: string;

  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clienteId: string;
}
