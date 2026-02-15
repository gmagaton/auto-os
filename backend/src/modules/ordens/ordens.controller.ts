import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdensService } from './ordens.service';
import { RelatoriosService } from '../relatorios/relatorios.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
import { UpdateOrdemDto } from './dto/update-ordem.dto';
import { CreateFotoDto } from './dto/create-foto.dto';
import { FiltroOrdensDto } from './dto/filtro-ordens.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ordens')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrdensController {
  constructor(
    private readonly ordensService: OrdensService,
    private readonly relatoriosService: RelatoriosService,
  ) {}

  @Get()
  findAll(@Query() filtros: FiltroOrdensDto) {
    return this.ordensService.findAll(filtros);
  }

  @Get('agenda')
  findByPeriodo(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.ordensService.findByPeriodo(inicio, fim);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordensService.findOne(id);
  }

  @Get(':id/historico')
  getHistorico(@Param('id') id: string) {
    return this.ordensService.getHistorico(id);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.relatoriosService.gerarOrcamentoPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="orcamento-${id.slice(-6)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post()
  create(
    @Body() dto: CreateOrdemDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ordensService.create(dto, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrdemDto) {
    return this.ordensService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordensService.remove(id);
  }

  @Post(':id/fotos')
  addFoto(@Param('id') id: string, @Body() dto: CreateFotoDto) {
    return this.ordensService.addFoto(id, dto);
  }

  @Delete(':id/fotos/:fotoId')
  removeFoto(@Param('fotoId') fotoId: string) {
    return this.ordensService.removeFoto(fotoId);
  }
}
