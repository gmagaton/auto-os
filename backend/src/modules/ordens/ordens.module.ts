import { Module } from '@nestjs/common';
import { OrdensService } from './ordens.service';
import { OrdensController } from './ordens.controller';
import { EmailModule } from '../email/email.module';
import { RelatoriosModule } from '../relatorios/relatorios.module';

@Module({
  imports: [EmailModule, RelatoriosModule],
  controllers: [OrdensController],
  providers: [OrdensService],
  exports: [OrdensService],
})
export class OrdensModule {}
