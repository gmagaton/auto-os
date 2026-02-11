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
import { ModelosService } from './modelos.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('modelos')
@UseGuards(JwtAuthGuard)
export class ModelosController {
  constructor(private modelosService: ModelosService) {}

  @Get()
  findAll(@Query('fabricanteId') fabricanteId?: string) {
    return this.modelosService.findAll(fabricanteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelosService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateModeloDto) {
    return this.modelosService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateModeloDto) {
    return this.modelosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.modelosService.remove(id);
  }
}
