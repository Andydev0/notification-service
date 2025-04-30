import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    const maxRetries = 10;
    const retryDelay = 3000; // 3 segundos
    let attempt = 0;
    let connected = false;

    while (!connected && attempt < maxRetries) {
      try {
        await this.$connect();
        console.log(' Conectado ao banco de dados');
        connected = true;
      } catch (err) {
        attempt++;
        console.warn(` Tentativa ${attempt} de conexão falhou. Repetindo em ${retryDelay / 1000}s...`);
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }

    if (!connected) {
      throw new Error(' Falha ao conectar com o banco de dados após múltiplas tentativas.');
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    // @ts-expect-error
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
