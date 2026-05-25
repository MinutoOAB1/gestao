import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import { InputSanitizerInterceptor } from './common/security/input-sanitizer.interceptor';

// @ts-ignore
const compression = require('compression');

// ============ Vercel Serverless Handler ============
let cachedServer: any;

async function createServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
    rawBody: true,
  });

  app.use(compression());
  app.use(express.json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 🔒 SEGURANÇA [XSS-PREVENTION]: Habilita sanitizador global de entradas (XSS e Injeções de Script)
  app.useGlobalInterceptors(new InputSanitizerInterceptor());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.init();
  cachedServer = expressApp;
  return expressApp;
}

// Vercel handler export
export default async function handler(req: any, res: any) {
  // Strip the /_/backend prefix so NestJS routes match correctly
  if (req.url && req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '') || '/';
  }

  const server = await createServer();
  server(req, res);
}

// ============ Local Development Server ============
if (!process.env.VERCEL) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });
    app.use(compression());
    app.use(express.json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

    // 🔒 SEGURANÇA [XSS-PREVENTION]: Habilita sanitizador global de entradas no ambiente de desenvolvimento local
    app.useGlobalInterceptors(new InputSanitizerInterceptor());

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  }
  bootstrap();
}
// Trigger Hot Reload
