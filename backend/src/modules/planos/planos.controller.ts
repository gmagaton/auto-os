import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PlanosService } from './planos.service';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('planos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class PlanosController {
  constructor(private planosService: PlanosService) {}

  @Get()
  findAll() {
    return this.planosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlanoDto) {
    return this.planosService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePlanoDto>) {
    return this.planosService.update(id, dto);
  }
}
