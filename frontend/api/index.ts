import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../../backend/src/app.module';
import express from 'express';

// @ts-ignore
const compression = require('compression');

let cachedServer: any;

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

  try {
    const server = await createServer();
    return server(req, res);
  } catch (error: any) {
    console.error('SERVERLESS BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure',
      message: error.message,
      method: req.method,
      url: req.url,
      path: 'frontend/api/index.ts'
    });
  }
}
