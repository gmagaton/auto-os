import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class TrocarPlanoDto {
  @IsString()
  planoId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  meses?: number;
}
