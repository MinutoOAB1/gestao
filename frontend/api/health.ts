import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import express from 'express';
import { PrismaService } from '../backend/src/prisma/prisma.service';

const compression = require('compression');

let cachedApp: any;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      const expressApp = express();
      const adapter = new ExpressAdapter(expressApp);
      cachedApp = await NestFactory.create(AppModule, adapter, { logger: false });
      await cachedApp.init();
    }

    const prisma = cachedApp.get(PrismaService);
    const userCount = await prisma.user.count();

    res.status(200).json({
      status: 'UP',
      framework: 'NestJS',
      database: 'Supabase (Connected)',
      userCount,
      timestamp: new Date().toISOString(),
      location: 'root/api/health.ts'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
}
