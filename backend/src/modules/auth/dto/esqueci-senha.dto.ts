import { IsEmail } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'Email invalido' })
  email: string;
}
