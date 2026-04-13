import 'reflect-metadata';
import express from 'express';

// @ts-ignore
const compression = require('compression');

let cachedServer: any;
let cachedApp: any;

async function createServer() {
  if (cachedServer) return cachedServer;

  // STEP 1: LOAD NEST CORE
  let NestFactory, ExpressAdapter;
  try {
    const core = await import('@nestjs/core');
    NestFactory = core.NestFactory;
    const adapterMod = await import('@nestjs/platform-express');
    ExpressAdapter = adapterMod.ExpressAdapter;
  } catch (err: any) {
    throw new Error(`Framework Load Fail: ${err.message}`);
  }

  // STEP 2: LOAD APP MODULE
  let AppModule;
  try {
    // Dynamic import to isolate local file loading
    const appMod = await import('../backend/src/app.module');
    AppModule = appMod.AppModule;
  } catch (err: any) {
    throw new Error(`AppModule Load Fail: ${err.message}`);
  }

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
  // Diagnostic log
  console.log(`[BOOTSTRAP ATTEMPT] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // HEALTH CHECK DIAGNOSTIC
  if (req.url === '/api/debug/health') {
    try {
      const server = await createServer();
      
      // Attempt to load Prisma Service dynamically
      let prisma;
      try {
        const { PrismaService } = await import('../backend/src/prisma/prisma.service');
        prisma = cachedApp.get(PrismaService);
      } catch (pErr: any) {
        return res.status(200).json({ status: 'UP', backend: 'MOCK (Prisma Load Error)', error: pErr.message });
      }

      const userCount = await prisma.user.count();
      return res.status(200).json({
        status: 'UP',
        dbConnection: 'OK',
        userCount,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'CRITICAL_BOOT_FAIL',
        error: err.message,
        stack: err.stack,
        hint: 'This means the code crashed before even handling the request.'
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
      stack: error.stack,
      hint: 'The NestJS application failed to initialize on Vercel.'
    });
  }
}
