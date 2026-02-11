import { Controller, Get, Post, Param, Query, NotFoundException } from '@nestjs/common';
import { OrdensService } from '../ordens/ordens.service';
import { ChecklistService } from '../checklist/checklist.service';

@Controller('portal')
export class PortalController {
  constructor(
    private ordensService: OrdensService,
    private checklistService: ChecklistService,
  ) {}

  @Get(':token')
  async getOrdem(@Param('token') token: string) {
    return this.ordensService.findByToken(token);
  }

  @Get(':token/checklist')
  async getChecklist(@Param('token') token: string) {
    return this.checklistService.getChecklistByOrdemToken(token);
  }

  @Post(':token/aprovar')
  async aprovar(
    @Param('token') token: string,
    @Query('ordemId') ordemId: string,
  ) {
    if (!ordemId) {
      throw new NotFoundException('ID da ordem e obrigatorio');
    }
    return this.ordensService.aprovar(ordemId, token);
  }
}
