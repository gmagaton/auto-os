import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantService } from '../tenant/tenant.service';
import { AssinaturasService } from './assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { TrocarPlanoDto } from './dto/trocar-plano.dto';

@Controller('assinatura')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AssinaturaController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly assinaturasService: AssinaturasService,
    private readonly planosService: PlanosService,
  ) {}

  @Get()
  getAssinatura() {
    return this.assinaturasService.getAssinaturaAtiva(this.tenantService.empresaId);
  }

  @Get('planos')
  getPlanos() {
    return this.planosService.findAllActive();
  }

  @Post('trocar-plano')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  trocarPlano(@Body() dto: TrocarPlanoDto) {
    return this.assinaturasService.renovar(
      this.tenantService.empresaId,
      dto.planoId,
      dto.meses ?? 1,
    );
  }
}
