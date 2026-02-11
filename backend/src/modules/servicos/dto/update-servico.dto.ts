import { IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateServicoDto {
  @IsOptional()
  nome?: string;

  @IsOptional()
  @IsEnum(['SERVICO', 'ADICIONAL'], { message: 'Tipo inválido' })
  tipo?: 'SERVICO' | 'ADICIONAL';

  @IsOptional()
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
  valor?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
