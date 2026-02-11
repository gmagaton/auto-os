import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existe) {
      throw new ConflictException('Email já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        papel: dto.papel,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
      },
    });
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.email) {
      const existe = await this.prisma.usuario.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });

      if (existe) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    const data: {
      nome?: string;
      email?: string;
      senha?: string;
      papel?: 'ADMIN' | 'ATENDENTE';
      ativo?: boolean;
    } = { ...dto };
    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, 12);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        criadoEm: true,
      },
    });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException(
        'Não é possível excluir seu próprio usuário',
      );
    }

    await this.findOne(id);

    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}
