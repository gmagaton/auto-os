import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { OrdensModule } from '../ordens/ordens.module';
import { ChecklistModule } from '../checklist/checklist.module';

@Module({
  imports: [OrdensModule, ChecklistModule],
  controllers: [PortalController],
})
export class PortalModule {}
