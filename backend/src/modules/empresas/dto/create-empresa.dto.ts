import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  planoId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  meses?: number;
}
