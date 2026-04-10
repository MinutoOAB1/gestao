import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../../backend/src/app.module';
import * as express from 'express';

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

  // Parity with local main.ts configuration
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.init();
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  // Diagnostic headers
  res.setHeader('X-Backend-Initialized', 'true');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Ping/Health check bypass for rapid verification
    if (req.url === '/api/ping' || req.url === '/api/health') {
        return res.status(200).json({ status: 'ok', source: 'serverless-handler' });
    }

    // Strip the /api prefix so NestJS internal routes match correctly
    if (req.url && req.url.startsWith('/api')) {
      req.url = req.url.replace('/api', '') || '/';
    }

    const server = await createServer();
    return server(req, res);
  } catch (error: any) {
    console.error('SERVERLESS BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure (Manual Build Mode)',
      message: error.message,
      hint: 'Verify DATABASE_URL environment variable and Prisma Client generation.'
    });
  }
}
