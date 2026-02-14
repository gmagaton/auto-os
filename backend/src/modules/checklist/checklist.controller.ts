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
import { ChecklistService } from './checklist.service';
import { CreateItemChecklistDto } from './dto/create-item-checklist.dto';
import { UpdateItemChecklistDto } from './dto/update-item-checklist.dto';
import { PreencherChecklistDto } from './dto/preencher-checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private checklistService: ChecklistService) {}

  // === ITENS CONFIG ===

  @Get('itens')
  findAllItens(@Query('includeInactive') includeInactive?: string) {
    return this.checklistService.findAllItens(includeInactive === 'true');
  }

  @Get('itens/:id')
  findOneItem(@Param('id') id: string) {
    return this.checklistService.findOneItem(id);
  }

  @Post('itens')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createItem(@Body() dto: CreateItemChecklistDto) {
    return this.checklistService.createItem(dto);
  }

  @Put('itens/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemChecklistDto) {
    return this.checklistService.updateItem(id, dto);
  }

  @Delete('itens/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeItem(@Param('id') id: string) {
    return this.checklistService.removeItem(id);
  }

  @Get('categorias')
  getCategorias() {
    return this.checklistService.getCategorias();
  }

  // === CHECKLIST PREENCHIDO ===

  @Get('ordem/:ordemId')
  getChecklistByOrdem(@Param('ordemId') ordemId: string) {
    return this.checklistService.getChecklistByOrdem(ordemId);
  }

  @Get('ordem/:ordemId/status')
  getChecklistStatus(@Param('ordemId') ordemId: string) {
    return this.checklistService.getChecklistStatus(ordemId);
  }

  @Post('ordem/:ordemId')
  preencherChecklist(
    @Param('ordemId') ordemId: string,
    @Body() dto: PreencherChecklistDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.checklistService.preencherChecklist(ordemId, dto, user.id);
  }
}
