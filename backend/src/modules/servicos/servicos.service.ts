import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { TipoServico } from '../../../generated/prisma/enums';

@Injectable()
export class ServicosService {
  constructor(private prisma: PrismaService) {}

  async findAll(tipo?: TipoServico) {
    return this.prisma.servico.findMany({
      where: {
        ativo: true,
        ...(tipo && { tipo }),
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const servico = await this.prisma.servico.findUnique({
      where: { id },
    });

    if (!servico) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return servico;
  }

  async create(dto: CreateServicoDto) {
    return this.prisma.servico.create({
      data: {
        nome: dto.nome,
        tipo: dto.tipo,
        valor: dto.valor,
      },
    });
  }

  async update(id: string, dto: UpdateServicoDto) {
    await this.findOne(id);

    return this.prisma.servico.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verificar se tem itens de orçamento vinculados
    const itensVinculados = await this.prisma.itemOrcamento.count({
      where: { servicoId: id },
    });

    if (itensVinculados > 0) {
      throw new BadRequestException(
        'Não é possível excluir serviço com itens de orçamento vinculados',
      );
    }

    return this.prisma.servico.delete({
      where: { id },
    });
  }
}
