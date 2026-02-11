import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatusChecklist {
  OK = 'OK',
  DEFEITO = 'DEFEITO',
  NAO_APLICA = 'NAO_APLICA',
}

export class ItemPreenchidoDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsEnum(StatusChecklist)
  status: StatusChecklist;

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class PreencherChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPreenchidoDto)
  itens: ItemPreenchidoDto[];
}
