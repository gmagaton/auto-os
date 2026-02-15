import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async findAll(busca?: string) {
    return this.prisma.cliente.findMany({
      where: {
        empresaId: this.tenant.empresaId,
        ...(busca
          ? {
              OR: [
                { nome: { contains: busca, mode: 'insensitive' } },
                { telefone: { contains: busca, mode: 'insensitive' } },
                { email: { contains: busca, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        documento: true,
        criadoEm: true,
        _count: {
          select: {
            veiculos: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId: this.tenant.empresaId },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        documento: true,
        criadoEm: true,
        veiculos: {
          select: {
            id: true,
            placa: true,
            cor: true,
            ano: true,
            modelo: {
              select: {
                id: true,
                nome: true,
                fabricante: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return cliente;
  }

  async create(dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        nome: dto.nome,
        telefone: dto.telefone,
        email: dto.email,
        documento: dto.documento,
        empresaId: this.tenant.empresaId,
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        documento: true,
        criadoEm: true,
      },
    });
  }

  async update(id: string, dto: UpdateClienteDto) {
    await this.findOne(id);

    return this.prisma.cliente.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        documento: true,
        criadoEm: true,
      },
    });
  }

  async remove(id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId: this.tenant.empresaId },
      include: {
        _count: {
          select: {
            veiculos: true,
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (cliente._count.veiculos > 0) {
      throw new BadRequestException(
        'Não é possível excluir cliente com veículos vinculados',
      );
    }

    return this.prisma.cliente.delete({
      where: { id },
    });
  }
}
