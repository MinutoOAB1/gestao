import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import express from 'express';
import { PrismaService } from '../backend/src/prisma/prisma.service';

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

  // Native NestJS routing prefix
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
  // Diagnostic log for Vercel
  console.log(`[FRONTEND API REQUEST] ${req.method} ${req.url}`);

  // OPTIONS Preflight handler
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // Health & Debug check
  if (req.url === '/api/debug/health') {
    try {
      await createServer();
      const prisma = cachedApp.get(PrismaService);
      const userCount = await prisma.user.count();
      return res.status(200).json({
        status: 'UP',
        dbConnection: 'OK',
        userCount,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasPrisma: !!prisma,
        hasApp: !!cachedApp
      });
    } catch (dbErr: any) {
      return res.status(500).json({
        status: 'DOWN',
        dbError: dbErr.message,
        stack: dbErr.stack,
        hint: 'Check DATABASE_URL and if prisma generate was run.'
      });
    }
  }

  try {
    const server = await createServer();
    return server(req, res);
  } catch (error: any) {
    console.error('SERVERLESS BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure',
      message: error.message,
      stack: error.stack, // Temporarily verbose
      method: req.method,
      url: req.url,
      path: 'frontend/api/index.ts'
    });
  }
}
