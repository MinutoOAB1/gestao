// Vercel Serverless Function entry point
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedApp: any;

async function createApp() {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  // Increase body size limit
  app.use(express.json({ limit: '50mb' }));
  app.use((express as any).urlencoded
    ? (express as any).urlencoded({ extended: true, limit: '50mb' })
    : (_req: any, _res: any, next: any) => next()
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  // Strip the /_/backend prefix so NestJS routes match correctly
  if (req.url && req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '') || '/';
  }
  
  const app = await createApp();
  app(req, res);
}
