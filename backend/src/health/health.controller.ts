import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Test DB connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local',
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
