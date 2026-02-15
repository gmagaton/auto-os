import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';

@Injectable()
export class VeiculosService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async findAll(clienteId?: string, busca?: string) {
    return this.prisma.veiculo.findMany({
      where: {
        empresaId: this.tenant.empresaId,
        ...(clienteId && { clienteId }),
        ...(busca && {
          OR: [
            { placa: { contains: busca, mode: 'insensitive' } },
            { modelo: { nome: { contains: busca, mode: 'insensitive' } } },
          ],
        }),
      },
      select: {
        id: true,
        placa: true,
        cor: true,
        ano: true,
        criadoEm: true,
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
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const veiculo = await this.prisma.veiculo.findFirst({
      where: { id, empresaId: this.tenant.empresaId },
      select: {
        id: true,
        placa: true,
        cor: true,
        ano: true,
        criadoEm: true,
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
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
          },
        },
        ordens: {
          select: {
            id: true,
            token: true,
            status: true,
            valorTotal: true,
            criadoEm: true,
          },
          orderBy: { criadoEm: 'desc' },
          take: 10,
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return veiculo;
  }

  async create(dto: CreateVeiculoDto) {
    return this.prisma.veiculo.create({
      data: {
        placa: dto.placa.toUpperCase(),
        cor: dto.cor,
        ano: dto.ano,
        modeloId: dto.modeloId,
        clienteId: dto.clienteId,
        empresaId: this.tenant.empresaId,
      },
      select: {
        id: true,
        placa: true,
        cor: true,
        ano: true,
        criadoEm: true,
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
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateVeiculoDto) {
    await this.findOne(id);

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.placa) {
      updateData.placa = dto.placa.toUpperCase();
    }

    return this.prisma.veiculo.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        placa: true,
        cor: true,
        ano: true,
        criadoEm: true,
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
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const veiculo = await this.prisma.veiculo.findFirst({
      where: { id, empresaId: this.tenant.empresaId },
      include: {
        _count: {
          select: {
            ordens: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    if (veiculo._count.ordens > 0) {
      throw new BadRequestException(
        'Não é possível excluir veículo com ordens de serviço vinculadas',
      );
    }

    return this.prisma.veiculo.delete({
      where: { id },
    });
  }
}
