import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV ?? 'development',
    });
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // Comprimir todas las respuestas JSON >= 1KB (reduce tráfico ~60-70%)
  app.use(compression());
  // Body limit reducido: 8mb era un vector DoS para cualquier usuario autenticado
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  const parseOrigins = (rawValue: string): string[] =>
    rawValue
      .split(/[\s,]+/)
      .map((origin) => origin.trim())
      .filter(Boolean);

  // Configurar helmet para permitir iframes desde el frontend
  const allowEmbedOrigins =
    process.env.EMBED_ORIGINS ?? 'http://localhost:3000 http://localhost:3001';
  const frameAncestors = parseOrigins(allowEmbedOrigins);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          frameAncestors,
        },
      },
      crossOriginOpenerPolicy: false,
    }),
  );
  // CORS: permitir cookies/credenciales y orígenes específicos (por defecto Next dev)
  const corsOrigin =
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001';
  const allowedOrigins = parseOrigins(corsOrigin);
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useGlobalPipes(
    new SanitizeInputPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('R.E.C API')
    .setDescription('Documentación de la API del sistema R.E.C')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  app.get(Logger).log(`R.E.C Backend listening on port ${port}`);
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
