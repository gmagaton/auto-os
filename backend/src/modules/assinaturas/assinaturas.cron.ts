import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AssinaturasService } from './assinaturas.service';

@Injectable()
export class AssinaturasCron {
  constructor(private assinaturasService: AssinaturasService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarVencimentos() {
    await this.assinaturasService.verificarVencimentos();
  }
}
