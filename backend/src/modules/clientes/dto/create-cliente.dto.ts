import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  documento?: string;
}
