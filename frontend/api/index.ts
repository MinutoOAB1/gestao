import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
// Adjusted path: frontend/api -> .. (frontend) -> .. (root) -> backend/src
import { AppModule } from '../../backend/src/app.module';
import { PrismaService } from '../../backend/src/prisma/prisma.service';
import express from 'express';

// @ts-ignore
const compression = require('compression');

let cachedServer: any;
let cachedApp: any;

async function createServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  await app.init();
  cachedApp = app;
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  console.log(`[FRONTEND-API REQUEST] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // Unified Health Check
  if (req.url === '/api/debug/health' || req.url === '/debug/health') {
    try {
      const server = await createServer();
      const prisma = cachedApp.get(PrismaService);
      const userCount = await prisma.user.count();
      return res.status(200).json({
        status: 'UP',
        dbConnection: 'OK',
        userCount,
        timestamp: new Date().toISOString(),
        location: 'frontend/api/index.ts'
      });
    } catch (dbErr: any) {
      return res.status(500).json({
        status: 'DOWN',
        error: dbErr.message,
        hint: 'Check DATABASE_URL in Vercel settings.'
      });
    }
  }

  try {
    const server = await createServer();
    return server(req, res);
  } catch (error: any) {
    console.error('BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure',
      message: error.message,
      location: 'frontend/api/index.ts'
    });
  }
}
