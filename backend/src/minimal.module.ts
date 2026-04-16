import { Module, Controller, Get } from '@nestjs/common';

@Controller('diagnostic')
export class DiagnosticController {
  @Get('hello')
  getStatus() {
    return {
      status: 'OK',
      message: 'NestJS Minimal Module is ALIVE',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    };
  }
}

@Module({
  controllers: [DiagnosticController],
})
export class MinimalModule {}
