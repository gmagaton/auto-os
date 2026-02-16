import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Injectable()
export class AuthService {
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private assinaturasService: AssinaturasService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: dto.email,
        ...(dto.slug ? { empresa: { slug: dto.slug } } : {}),
      },
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

  async verificarSlug(slug: string) {
    const existing = await this.prisma.empresa.findUnique({ where: { slug } });
    return { disponivel: !existing };
  }

  async registro(dto: RegistroDto) {
    const slug = dto.slug || this.generateSlug(dto.nomeEmpresa);

    // Validate slug uniqueness
    const existingEmpresa = await this.prisma.empresa.findUnique({ where: { slug } });
    if (existingEmpresa) {
      throw new ConflictException('Slug ja em uso');
    }

    // Create empresa
    const empresa = await this.prisma.empresa.create({
      data: {
        nome: dto.nomeEmpresa,
        slug,
        status: 'ATIVA',
      },
    });

    // Create trial subscription
    await this.assinaturasService.criarTrial(empresa.id);

    // Create admin user
    const senhaHash = await bcrypt.hash(dto.senha, 12);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nomeAdmin,
        email: dto.email,
        senha: senhaHash,
        papel: 'ADMIN',
        empresaId: empresa.id,
      },
    });

    // Auto-login
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: empresa.id,
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
      empresa: {
        id: empresa.id,
        slug: empresa.slug,
        nome: empresa.nome,
        logoUrl: empresa.logoUrl,
      },
    };
  }

  async esqueciSenha(email: string) {
    const usuarios = await this.prisma.usuario.findMany({
      where: { email },
      include: { empresa: { select: { slug: true, nome: true } } },
    });

    // For each user with this email, generate a reset token
    for (const usuario of usuarios) {
      const expiradoEm = new Date();
      expiradoEm.setHours(expiradoEm.getHours() + 1);

      const reset = await this.prisma.resetSenha.create({
        data: {
          usuarioId: usuario.id,
          expiradoEm,
        },
      });

      const link = `${this.frontendUrl}/${usuario.empresa.slug}/redefinir-senha/${reset.token}`;
      this.emailService.enviarResetSenha(
        usuario.email,
        usuario.nome,
        link,
        usuario.empresa.nome,
      );
    }

    return { message: 'Se o email existir, enviaremos instrucoes de redefinicao de senha.' };
  }

  async redefinirSenha(token: string, novaSenha: string) {
    const reset = await this.prisma.resetSenha.findFirst({
      where: {
        token,
        usadoEm: null,
        expiradoEm: { gt: new Date() },
      },
    });

    if (!reset) {
      throw new BadRequestException('Token invalido ou expirado');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);

    await this.prisma.usuario.update({
      where: { id: reset.usuarioId },
      data: { senha: senhaHash },
    });

    await this.prisma.resetSenha.update({
      where: { id: reset.id },
      data: { usadoEm: new Date() },
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  private generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
