import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateItemChecklistDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
