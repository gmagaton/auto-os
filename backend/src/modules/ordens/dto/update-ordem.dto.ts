import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class ItemOrdemDto {
  @IsNotEmpty({ message: 'servicoId é obrigatório' })
  @IsString()
  servicoId: string;

  @IsNotEmpty({ message: 'valor é obrigatório' })
  @IsNumber({}, { message: 'valor deve ser um número' })
  valor: number;
}

export class UpdateOrdemDto {
  @IsOptional()
  @IsEnum(['AGUARDANDO', 'APROVADO', 'AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO'], {
    message: 'status inválido',
  })
  status?: 'AGUARDANDO' | 'APROVADO' | 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO';

  @IsOptional()
  @IsString()
  dataAgendada?: string;

  @IsOptional()
  @IsArray({ message: 'itens deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemDto)
  itens?: ItemOrdemDto[];
}
