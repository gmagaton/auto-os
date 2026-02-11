import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - startTime;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
