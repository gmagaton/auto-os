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
} from '@nestjs/common';
import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantGuard } from '../tenant/tenant.guard';
import { TipoServico } from '../../../generated/prisma/enums';

@Controller('servicos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ServicosController {
  constructor(private servicosService: ServicosService) {}

  @Get()
  findAll(@Query('tipo') tipo?: TipoServico) {
    return this.servicosService.findAll(tipo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicosService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateServicoDto) {
    return this.servicosService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateServicoDto) {
    return this.servicosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.servicosService.remove(id);
  }
}
