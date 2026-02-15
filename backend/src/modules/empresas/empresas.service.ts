import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { StatusEmpresa } from '../../../generated/prisma/enums';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll(busca?: string) {
    return this.prisma.empresa.findMany({
      where: busca ? {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { slug: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } },
        ],
      } : undefined,
      select: {
        id: true,
        nome: true,
        slug: true,
        status: true,
        plano: true,
        dataVencimento: true,
        criadoEm: true,
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            ordens: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        slug: true,
        logoUrl: true,
        telefone: true,
        email: true,
        endereco: true,
        status: true,
        plano: true,
        dataVencimento: true,
        criadoEm: true,
        atualizadoEm: true,
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            veiculos: true,
            ordens: true,
            servicos: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa nao encontrada');
    }

    return empresa;
  }

  async getStats(id: string) {
    await this.findOne(id);

    const [usuarios, ordens, faturamento] = await Promise.all([
      this.prisma.usuario.count({ where: { empresaId: id } }),
      this.prisma.ordemServico.count({ where: { empresaId: id } }),
      this.prisma.ordemServico.aggregate({
        where: { empresaId: id, status: 'FINALIZADO' },
        _sum: { valorTotal: true },
      }),
    ]);

    return {
      usuarios,
      ordens,
      faturamento: Number(faturamento._sum.valorTotal || 0),
    };
  }

  async create(dto: CreateEmpresaDto) {
    const slug = dto.slug || this.generateSlug(dto.nome);

    // Check slug uniqueness
    const existing = await this.prisma.empresa.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Slug ja em uso');
    }

    return this.prisma.empresa.create({
      data: {
        nome: dto.nome,
        slug,
        telefone: dto.telefone,
        email: dto.email,
        endereco: dto.endereco,
        plano: dto.plano,
        dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : null,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.empresa.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Slug ja em uso');
      }
    }

    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...dto,
        dataVencimento: dto.dataVencimento ? new Date(dto.dataVencimento) : undefined,
      },
    });
  }

  async updateStatus(id: string, status: StatusEmpresa) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if empresa has any data
    const counts = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        _count: {
          select: { usuarios: true, ordens: true },
        },
      },
    });

    if (counts && (counts._count.usuarios > 0 || counts._count.ordens > 0)) {
      throw new ConflictException('Nao e possivel excluir empresa com dados vinculados');
    }

    return this.prisma.empresa.delete({ where: { id } });
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
