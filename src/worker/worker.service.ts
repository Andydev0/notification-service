import { Injectable, OnModuleInit } from '@nestjs/common';
import { connect, Channel, Connection } from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class WorkerService implements OnModuleInit {
  private connection: Connection;
  private channel: Channel;
  private readonly queue = 'notifications_queue';
  private readonly dlq = 'notifications_dlq';

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async onModuleInit() {
    const rabbitmqUrl = process.env.RABBITMQ_URL;
    this.connection = await connect(rabbitmqUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.assertQueue(this.dlq, { durable: true });

    this.channel.consume(this.queue, async (msg) => {
      if (msg) {
        const content = msg.content.toString();
        const data = JSON.parse(content);

        console.log('Mensagem recebida do RabbitMQ:', data);

        const maxRetries = 3;
        let retryCount = (msg.properties.headers['x-retries'] || 0) + 1;

        try {
          const delay = Math.floor(Math.random() * 3000) + 2000;
          await new Promise((res) => setTimeout(res, delay));

          if (data.message === 'forcar_erro') {
            throw new Error('Erro forçado via conteúdo da mensagem');
          }

          await this.prisma.notification.update({
            where: { id: data.id },
            data: { status: 'PROCESSED' },
          });

          this.metrics.incrementProcessed();
          console.log('Processed incrementado. Total:', this.metrics.getMetrics().processed);

          this.channel.ack(msg);
        } catch (err) {
          console.error(`Erro ao processar. Tentativa ${retryCount}:`, err.message);

          if (retryCount >= maxRetries) {
            console.log('Enviando para Dead Letter Queue');
            await this.sendToDLQ(data, err.message);

            await this.prisma.notification.update({
              where: { id: data.id },
              data: { status: 'FAILED' },
            });

            this.metrics.incrementFailed();
            console.log('Failed incrementado. Total:', this.metrics.getMetrics().failed);

            this.channel.ack(msg);
          } else {
            this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(data)), {
              headers: { 'x-retries': retryCount },
              persistent: true,
            });

            this.channel.ack(msg);
          }
        }
      }
    });
  }

  private async sendToDLQ(data: any, errorMessage: string) {
    const failedMessage = {
      ...data,
      failedAt: new Date().toISOString(),
      error: errorMessage,
    };

    this.channel.sendToQueue(this.dlq, Buffer.from(JSON.stringify(failedMessage)), {
      persistent: true,
    });
  }
}
