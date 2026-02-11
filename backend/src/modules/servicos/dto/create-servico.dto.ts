import { IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateServicoDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsEnum(['SERVICO', 'ADICIONAL'], { message: 'Tipo inválido' })
  tipo: 'SERVICO' | 'ADICIONAL';

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
  valor: number;
}
