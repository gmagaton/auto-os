import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanoDto } from './dto/create-plano.dto';

@Injectable()
export class PlanosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plano.findMany({
      orderBy: { preco: 'asc' },
    });
  }

  async findAllActive() {
    return this.prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { preco: 'asc' },
    });
  }

  async findOne(id: string) {
    const plano = await this.prisma.plano.findUnique({ where: { id } });
    if (!plano) {
      throw new NotFoundException('Plano nao encontrado');
    }
    return plano;
  }

  async create(dto: CreatePlanoDto) {
    const existing = await this.prisma.plano.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Slug de plano ja em uso');
    }

    return this.prisma.plano.create({
      data: {
        nome: dto.nome,
        slug: dto.slug,
        maxUsuarios: dto.maxUsuarios ?? null,
        preco: dto.preco,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async update(id: string, dto: Partial<CreatePlanoDto>) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.plano.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Slug de plano ja em uso');
      }
    }

    return this.prisma.plano.update({
      where: { id },
      data: dto,
    });
  }
}
