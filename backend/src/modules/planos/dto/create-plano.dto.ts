import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreatePlanoDto {
  @IsString()
  nome: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  maxUsuarios?: number;

  @IsNumber()
  preco: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
