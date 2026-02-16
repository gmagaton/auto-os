import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StatusEmpresa } from '../../../generated/prisma/enums';
import { AssinaturasService } from '../assinaturas/assinaturas.service';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class EmpresasController {
  constructor(
    private empresasService: EmpresasService,
    private assinaturasService: AssinaturasService,
  ) {}

  @Get()
  findAll(@Query('busca') busca?: string) {
    return this.empresasService.findAll(busca);
  }

  @Get('dashboard')
  getDashboardStats() {
    return this.empresasService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.empresasService.getStats(id);
  }

  @Post()
  async create(@Body() dto: CreateEmpresaDto) {
    const empresa = await this.empresasService.create(dto);

    if (dto.planoId) {
      if (dto.planoId === 'plano-trial') {
        await this.assinaturasService.criarTrial(empresa.id);
      } else {
        await this.assinaturasService.renovar(empresa.id, dto.planoId, dto.meses || 1);
      }
    }

    return empresa;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: StatusEmpresa) {
    return this.empresasService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empresasService.remove(id);
  }

  @Get(':id/assinatura')
  getAssinatura(@Param('id') id: string) {
    return this.assinaturasService.getAssinaturaAtiva(id);
  }

  @Post(':id/assinatura')
  criarAssinatura(
    @Param('id') id: string,
    @Body() body: { planoId: string; meses: number },
  ) {
    return this.assinaturasService.renovar(id, body.planoId, body.meses);
  }
}
