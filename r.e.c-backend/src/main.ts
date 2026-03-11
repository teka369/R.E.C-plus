import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
// ConfigService no usado para evitar conflictos de versiones

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '8mb' }));
  app.use(urlencoded({ extended: true, limit: '8mb' }));
  
  // Configurar helmet para permitir iframes desde el frontend
  const allowEmbedOrigins = process.env.EMBED_ORIGINS ?? 'http://localhost:3000 http://localhost:3001';
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: allowEmbedOrigins.split(' '),
      },
    },
    crossOriginOpenerPolicy: false,
  }));
  // CORS: permitir cookies/credenciales y orígenes específicos (por defecto Next dev)
  const corsOrigin =
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001';
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
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
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
