import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Injectable } from '@nestjs/common';

@Injectable()
class AppService {
  getHello(): string {
    return 'Hello from Dummy!';
  }
}

@Controller()
class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

import { PrismaModule } from './src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
class DummyModule {}

async function bootstrap() {
  console.log('Bootstrapping dummy app...');
  try {
    const app = await NestFactory.create(DummyModule);
    await app.listen(3001);
    console.log('Dummy app listening on port 3001');
  } catch (err) {
    console.error('Bootstrapping failed:', err);
  }
}

bootstrap();
