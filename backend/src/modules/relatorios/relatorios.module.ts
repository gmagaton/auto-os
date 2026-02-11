import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RelatoriosService],
  exports: [RelatoriosService],
})
export class RelatoriosModule {}
