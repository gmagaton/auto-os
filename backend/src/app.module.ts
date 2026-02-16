import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { FabricantesModule } from './modules/fabricantes/fabricantes.module';
import { ModelosModule } from './modules/modelos/modelos.module';
import { ServicosModule } from './modules/servicos/servicos.module';
import { UploadModule } from './modules/upload/upload.module';
import { VeiculosModule } from './modules/veiculos/veiculos.module';
import { OrdensModule } from './modules/ordens/ordens.module';
import { PortalModule } from './modules/portal/portal.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { EmailModule } from './modules/email/email.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { HealthModule } from './health/health.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { PlanosModule } from './modules/planos/planos.module';
import { AssinaturasModule } from './modules/assinaturas/assinaturas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
        template: {
          dir: join(__dirname, '..', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TenantModule,
    EmpresasModule,
    PlanosModule,
    AssinaturasModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    FabricantesModule,
    ModelosModule,
    ServicosModule,
    UploadModule,
    VeiculosModule,
    OrdensModule,
    PortalModule,
    ChecklistModule,
    EmailModule,
    DashboardModule,
    RelatoriosModule,
    HealthModule,
  ],
})
export class AppModule {}
