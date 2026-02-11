import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateFabricanteDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;
}
