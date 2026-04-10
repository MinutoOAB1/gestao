// Ponto de entrada oficial para Vercel Serverless (na raiz)
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend/src/app.module';
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

  // Limite de tamanho para uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  // Limpa o prefixo /_/backend se existir para o NestJS processar a rota interna
  if (req.url) {
    req.url = req.url.replace('/_/backend', '') || '/';
    req.url = req.url.replace('/api', '') || '/';
  }
  
  const app = await createApp();
  app(req, res);
}
