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
import { VeiculosService } from './veiculos.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';

@Controller('veiculos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VeiculosController {
  constructor(private veiculosService: VeiculosService) {}

  @Get()
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('busca') busca?: string,
  ) {
    return this.veiculosService.findAll(clienteId, busca);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.veiculosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVeiculoDto) {
    return this.veiculosService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVeiculoDto) {
    return this.veiculosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.veiculosService.remove(id);
  }
}
