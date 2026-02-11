import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    };
  }

  async getProfile(userId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
      },
    });
  }
}
