import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';

@Injectable()
export class ModelosService {
  constructor(private prisma: PrismaService) {}

  async findAll(fabricanteId?: string) {
    return this.prisma.modelo.findMany({
      where: {
        ativo: true,
        ...(fabricanteId && { fabricanteId }),
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        fabricante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const modelo = await this.prisma.modelo.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        fabricante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!modelo) {
      throw new NotFoundException('Modelo não encontrado');
    }

    return modelo;
  }

  async create(dto: CreateModeloDto) {
    // Verifica se o fabricante existe
    const fabricante = await this.prisma.fabricante.findUnique({
      where: { id: dto.fabricanteId },
    });

    if (!fabricante) {
      throw new NotFoundException('Fabricante não encontrado');
    }

    // Verifica unicidade [fabricanteId, nome]
    const existe = await this.prisma.modelo.findUnique({
      where: {
        fabricanteId_nome: {
          fabricanteId: dto.fabricanteId,
          nome: dto.nome,
        },
      },
    });

    if (existe) {
      throw new ConflictException(
        'Modelo já cadastrado para este fabricante',
      );
    }

    return this.prisma.modelo.create({
      data: {
        nome: dto.nome,
        fabricanteId: dto.fabricanteId,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        fabricante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateModeloDto) {
    const modelo = await this.findOne(id);

    // Se nome ou fabricanteId alterados, valida unicidade
    if (dto.nome || dto.fabricanteId) {
      const fabricanteId = dto.fabricanteId || modelo.fabricante.id;
      const nome = dto.nome || modelo.nome;

      // Verifica se o novo fabricante existe (se alterado)
      if (dto.fabricanteId) {
        const fabricante = await this.prisma.fabricante.findUnique({
          where: { id: dto.fabricanteId },
        });

        if (!fabricante) {
          throw new NotFoundException('Fabricante não encontrado');
        }
      }

      const existe = await this.prisma.modelo.findFirst({
        where: {
          fabricanteId,
          nome,
          NOT: { id },
        },
      });

      if (existe) {
        throw new ConflictException(
          'Modelo já cadastrado para este fabricante',
        );
      }
    }

    return this.prisma.modelo.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        fabricante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const veiculosCount = await this.prisma.veiculo.count({
      where: { modeloId: id },
    });

    if (veiculosCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir modelo com veículos vinculados',
      );
    }

    return this.prisma.modelo.delete({
      where: { id },
    });
  }
}
