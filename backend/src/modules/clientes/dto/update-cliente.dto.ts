import { IsEmail, IsOptional } from 'class-validator';

export class UpdateClienteDto {
  @IsOptional()
  nome?: string;

  @IsOptional()
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  documento?: string;
}
