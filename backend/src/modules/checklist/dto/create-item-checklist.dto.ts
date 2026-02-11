import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class CreateItemChecklistDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @IsString()
  categoria: string;

  @IsInt()
  @Min(1)
  ordem: number;
}
