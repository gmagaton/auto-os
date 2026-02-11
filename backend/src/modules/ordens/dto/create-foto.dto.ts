import { IsNotEmpty, IsEnum, IsUrl } from 'class-validator';

export class CreateFotoDto {
  @IsNotEmpty({ message: 'url é obrigatória' })
  @IsUrl({ require_tld: false }, { message: 'url deve ser uma URL válida' })
  url: string;

  @IsNotEmpty({ message: 'tipo é obrigatório' })
  @IsEnum(['ENTRADA', 'PROGRESSO', 'FINAL'], {
    message: 'tipo deve ser ENTRADA, PROGRESSO ou FINAL',
  })
  tipo: 'ENTRADA' | 'PROGRESSO' | 'FINAL';
}
