import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS habilitado para testar no frontend 
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Validação habilitada com whitelist
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3000);
}
bootstrap();
