import { Module } from '@nestjs/common';
import { FabricantesService } from './fabricantes.service';
import { FabricantesController } from './fabricantes.controller';

@Module({
  controllers: [FabricantesController],
  providers: [FabricantesService],
  exports: [FabricantesService],
})
export class FabricantesModule {}
