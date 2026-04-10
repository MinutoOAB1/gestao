import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../../backend/src/app.module';
import * as express from 'express';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors();
    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async (req: any, res: any) => {
  try {
    // Basic diagnostic for root API calls
    if (req.url === '/api/health') {
        return res.status(200).json({ status: 'ok', bootstrap: 'started' });
    }

    const app = await bootstrap();
    
    // Strip prefix for internal routing
    if (req.url) {
      req.url = req.url.replace('/api', '') || '/';
    }

    return app(req, res);
  } catch (error: any) {
    console.error('BOOTSTRAP ERROR:', error);
    return res.status(500).json({
      error: 'Backend Bootstrap Failed',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      hint: 'Check if all dependencies are installed and DATABASE_URL is correct.'
    });
  }
};
