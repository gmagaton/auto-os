import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS - permite acesso de qualquer origem em desenvolvimento
  app.enableCors({
    origin: true, // Permite qualquer origem
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.setGlobalPrefix('api');

  // Servir arquivos estáticos da pasta uploads (fallback local para imagens)
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  const port = process.env.PORT || 3000;

  // Listen em 0.0.0.0 para aceitar conexões da rede local
  await app.listen(port, '0.0.0.0');

  console.log(`Backend rodando em http://0.0.0.0:${port}`);
}
bootstrap();
