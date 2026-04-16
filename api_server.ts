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

let ROOT_RES: any = null;
process.on('uncaughtException', (err) => {
  console.error('[FATAL UNCAUGHT EXCEPTION]', err);
  if (ROOT_RES && !ROOT_RES.headersSent) {
    ROOT_RES.status(500).json({ 
      error: "FATAL_RUNTIME_CRASH", 
      message: err.message, 
      stack: err.stack,
      hint: "Check for top-level code executing during module import."
    });
  }
});

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Diagnostic Import Trap
let AppModule: any;
let PrismaService: any;

// Full Application Restoration (NestJS 10 Stable)
try {
  console.log('[BOOTSTRAP] Loading AppModule src...');
  AppModule = require('./backend/src/app.module').AppModule;
  PrismaService = require('./backend/src/prisma/prisma.service').PrismaService;
  console.log('[BOOTSTRAP] AppModule src loaded successfully.');
} catch (loadErr: any) {
  console.error('[MODULE LOAD FAILURE]', loadErr);
  throw new Error(`Failed to load AppModule: ${loadErr.message}`);
}

// @ts-ignore
const compression = require('compression');

let cachedServer: any;
let cachedApp: any;

async function createServer() {
  if (cachedServer) return cachedServer;

  console.log('[BOOTSTRAP] Creating Express instance...');
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  console.log('[BOOTSTRAP] Executing NestFactory.create...');
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log', 'verbose'],
  });

  console.log('[BOOTSTRAP] Setting Global Prefix...');
  app.setGlobalPrefix('api');
  
  console.log('[BOOTSTRAP] Applying Global Middleware...');
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  console.log('[BOOTSTRAP] Configuring CORS...');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  console.log('[BOOTSTRAP] Executing app.init()...');
  await app.init();
  
  console.log('[BOOTSTRAP] Bootstrap sequence COMPLETE.');
  cachedApp = app;
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  ROOT_RES = res;
  console.log(`[ROOT API SERVER REQUEST] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // Minimal Infrastructure Test
  if (req.url === '/api/test-minimal') {
    return res.status(200).json({
      status: 'OK',
      message: 'Infrastructure is working. NestJS bootstrap was bypassed. Context: ROOT',
      timestamp: new Date().toISOString()
    });
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
        location: 'root/api_server.ts'
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
    console.error('FINAL BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failure',
      message: error.message,
      location: 'root/api_server.ts'
    });
  }
}
