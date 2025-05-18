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
    .setTitle('📮 Chilean Postal Codes API')
    .setDescription(
      `
📮 **The Chilean Postal Codes API** provides programmatic access to real-time and cached postal code data for Chile.

---

## 🔓 Free Public Endpoints (no authentication required)
These endpoints are open to everyone and ready to integrate into any system — no API key or contact required.

- \`GET /v1/health\` → System health status
- \`GET /v1/stats/summary\` → Record counts for each entity
- \`GET /v1/postal-codes/search\` → Search postal code by address
- \`GET /v1/regions/with-communes\` → List of Chilean regions
- \`GET /v1/communes/all\` → List of Chilean communes

## 🔐 Protected Endpoints (password required)
These endpoints provide full access to stored postal data, reverse lookups, internal tools, and data maintenance.
They are intended for **commercial** or **internal** use only.

- \`GET /v1/postal-codes\` → Paginated list of all postal codes
- \`GET /v1/postal-codes/:code\` → Reverse lookup: addresses for a postal code
- \`POST /v1/seeders/*\` → Seeding & normalization tools

> ⚠️ To access protected features or request a commercial subscription, contact us at [alejandro@kainext.cl](mailto:alejandro@kainext.cl).

---

🛠️ Built with ❤️ by [KaiNext](https://kainext.cl) — Cloud solutions that automate processes and scale real-world businesses.
`,
    )
    .setVersion('1.0')
    .setContact('KaiNext', 'https://kainext.cl', 'alejandro@kainext.cl')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
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
