import * as nodeCrypto from 'crypto';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/logger.service';
import { closeBrowser } from './utils/browser-provider.util';

// Make crypto available globally for Playwright (e.g. Railway, Docker)
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: nodeCrypto,
  });
}

const CONTEXT = 'Bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  logger.log('Starting application...', CONTEXT);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('v1');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('📦 KaiNext Location Data API')
    .setDescription(
      `
📦 **KaiNext Location Data API**
Real-time and cached geographic data for Chile — including postal codes, regions, communes, and streets.
**100% free, open, and ready to use** — no API keys, tokens, or sign-ups required.

---

## ✅ Public & Free Endpoints
All endpoints are fully open to the public.
Perfect for apps, integrations, academic research, and location-based systems.

### 🧩 System
- \`GET /v1/health\` → System health status
- \`GET /v1/stats/summary\` → Database record counts

### 📮 Postal Codes
- \`GET /v1/postal-codes/search\` → Search postal code by address
- \`GET /v1/postal-codes\` → Paginated list of all postal codes
- \`GET /v1/postal-codes/:code\` → Reverse lookup: addresses by postal code

### 🌍 Locations
- \`GET /v1/regions/with-communes\` → List of Chilean regions with communes
- \`GET /v1/communes/all\` → List of all Chilean communes
- \`GET /v1/streets\` → Paginated and filterable list of Chilean streets

---

🛠️ Built with ❤️ by [KaiNext](https://kainext.cl)
Cloud-native software to automate processes and scale real-world impact.
    `,
    )
    .setVersion('1.0')
    .setContact('KaiNext', 'https://kainext.cl', 'alejandro@kainext.cl')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('https://postal-code-api.kainext.cl', 'Production')
    .addServer('http://localhost:3000', 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/api', app, document);

  // Redirect root to Swagger UI
  app.getHttpAdapter().get('/', (_req, res) => {
    res.redirect('/v1/api');
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  function handleShutdown(signal: string): void {
    logger.log(`Received ${signal}. Closing app and browser...`, CONTEXT);
    void (async () => {
      try {
        await closeBrowser();
        await app.close();
        process.exit(0);
      } catch (err) {
        const error = err as Error;
        logger.error(
          `Error during shutdown (${signal})`,
          error.stack ?? String(error),
          CONTEXT,
        );
        process.exit(1);
      }
    })();
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!port || isNaN(port)) {
    logger.error('❌ Invalid PORT environment variable', undefined, CONTEXT);
    process.exit(1);
  }

  try {
    await app.listen(port, '0.0.0.0');
    const baseUrl = isProd
      ? `https://postal-code-api.kainext.cl`
      : `http://localhost:${port}`;
    logger.log(`🚀 Server ready at ${baseUrl}/v1/api`, CONTEXT);
  } catch (err) {
    const error = err as Error;
    logger.error(
      '❌ Failed to start server',
      error.stack ?? String(error),
      CONTEXT,
    );
  }
}

void bootstrap();
