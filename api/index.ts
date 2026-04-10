import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import * as express from 'express';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    // Explicitly set some environment flags
    process.env.NEST_BOOTSTRAP_CONTEXT = 'serverless';

    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn'],
      abortOnError: false,
    });

    app.enableCors();
    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async (req: any, res: any) => {
  // Always set JSON content-type to avoid Vercel treating 401s as HTML
  res.setHeader('Content-Type', 'application/json');

  try {
    // Health check bypass
    if (req.url === '/api/health' || req.url === '/api/ping') {
        return res.status(200).json({ status: 'ok', msg: 'Backend is online' });
    }

    const app = await bootstrap();
    
    // Strip prefix for internal routing
    if (req.url) {
      req.url = req.url.replace('/api', '') || '/';
    }

    return app(req, res);
  } catch (error: any) {
    console.error('BOOTSTRAP FATAL ERROR:', error);
    return res.status(500).json({
      error: 'Backend Failure',
      details: error.message,
      hint: 'Verification of DATABASE_URL and Prisma generation is required.'
    });
  }
};
