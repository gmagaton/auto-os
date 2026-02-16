import { Module } from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasCron } from './assinaturas.cron';
import { AssinaturaController } from './assinaturas.controller';
import { PlanosModule } from '../planos/planos.module';

@Module({
  imports: [PlanosModule],
  controllers: [AssinaturaController],
  providers: [AssinaturasService, AssinaturasCron],
  exports: [AssinaturasService],
})
export class AssinaturasModule {}
