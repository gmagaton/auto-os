import { IsNotEmpty, MinLength, IsString } from 'class-validator';

export class CreateModeloDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @IsNotEmpty({ message: 'Fabricante é obrigatório' })
  @IsString({ message: 'ID do fabricante inválido' })
  fabricanteId: string;
}
