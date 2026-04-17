// Vercel Serverless Node 20+ specific polyfills for missing browser APIS used by pdf.js/canvas
if (typeof global !== 'undefined') {
  if (typeof global.DOMMatrix === 'undefined') global.DOMMatrix = class DOMMatrix {} as any;
  if (typeof global.Path2D === 'undefined') global.Path2D = class Path2D {} as any;
  
  // Extended Browser Polyfills for contract/PDF libraries
  if (typeof global.window === 'undefined') global.window = global as any;
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: () => ({ getContext: () => ({}) }),
      getElementsByTagName: () => [],
      documentElement: { style: {} },
      querySelector: () => null,
      addEventListener: () => {},
    } as any;
  }
  if (typeof global.navigator === 'undefined') {
    global.navigator = { userAgent: 'node', platform: 'linux', languages: ['pt-BR'] } as any;
  }
}

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// @ts-ignore
const compression = require('compression');

let cachedServer: any;
let cachedApp: any;
let bootError: any = null;

// Lazy-load AppModule to capture errors properly
let AppModule: any;
let PrismaService: any;

try {
  AppModule = require('../backend/dist/src/app.module').AppModule;
  PrismaService = require('../backend/dist/src/prisma/prisma.service').PrismaService;
  console.log('[BOOTSTRAP] AppModule loaded successfully from backend/dist/src/');
} catch (err: any) {
  console.error('[BOOTSTRAP] Failed to load AppModule:', err.message);
  bootError = err;
}

async function createServer() {
  if (cachedServer) return cachedServer;
  if (bootError) throw bootError;

  console.log('[BOOTSTRAP] Creating NestJS app...');
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
  console.log('[BOOTSTRAP] NestJS app initialized successfully.');
  
  cachedApp = app;
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  console.log(`[API] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // Diagnostic endpoint - works even if NestJS fails to boot
  if (req.url === '/api/test-minimal') {
    return res.status(200).json({
      status: bootError ? 'ERROR' : 'OK',
      bootError: bootError ? { message: bootError.message, stack: bootError.stack } : null,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    });
  }

  try {
    const server = await createServer();
    return server(req, res);
  } catch (error: any) {
    console.error('[API ERROR]', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure',
      message: error.message,
      stack: error.stack,
    });
  }
}
