import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
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

export class CreateOrdemDto {
  @IsNotEmpty({ message: 'veiculoId é obrigatório' })
  @IsString()
  veiculoId: string;

  @IsOptional()
  @IsString()
  dataAgendada?: string;

  @IsArray({ message: 'itens deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemDto)
  itens: ItemOrdemDto[];
}
