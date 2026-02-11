import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FabricantesService } from './fabricantes.service';
import { CreateFabricanteDto } from './dto/create-fabricante.dto';
import { UpdateFabricanteDto } from './dto/update-fabricante.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('fabricantes')
@UseGuards(JwtAuthGuard)
export class FabricantesController {
  constructor(private fabricantesService: FabricantesService) {}

  @Get()
  findAll() {
    return this.fabricantesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fabricantesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateFabricanteDto) {
    return this.fabricantesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateFabricanteDto) {
    return this.fabricantesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.fabricantesService.remove(id);
  }
}
