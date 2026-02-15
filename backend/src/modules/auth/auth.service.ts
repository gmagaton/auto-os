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
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
      include: {
        empresa: {
          select: {
            id: true,
            slug: true,
            nome: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (
      usuario.empresa &&
      usuario.empresa.status !== 'ATIVA' &&
      usuario.papel !== 'SUPERADMIN'
    ) {
      throw new UnauthorizedException('Empresa inativa');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        empresaId: usuario.empresaId,
      },
      empresa: usuario.empresa
        ? {
            id: usuario.empresa.id,
            slug: usuario.empresa.slug,
            nome: usuario.empresa.nome,
            logoUrl: usuario.empresa.logoUrl,
          }
        : null,
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
        empresaId: true,
        empresa: {
          select: {
            id: true,
            slug: true,
            nome: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });
  }
}
