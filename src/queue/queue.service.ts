import { Injectable, OnModuleInit } from '@nestjs/common';
import { connect, Channel, Connection } from 'amqplib';

@Injectable()
export class QueueService implements OnModuleInit {
  private connection: Connection;
  private channel: Channel;
  private readonly exchange = 'notifications_exchange';
  private readonly queue = 'notifications_queue';

  async onModuleInit() {
    const maxRetries = 5;
    let attempt = 0;
    const retryDelay = 3000;

    while (attempt < maxRetries) {
      try {
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        this.connection = await connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(this.exchange, 'direct', { durable: true });
        await this.channel.assertQueue(this.queue, { durable: true });
        await this.channel.bindQueue(this.queue, this.exchange, 'notifications_key');

        console.log('Conectado ao RabbitMQ');
        break;
      } catch (err) {
        attempt++;
        console.warn(` Tentativa ${attempt} de conexão ao RabbitMQ falhou. Repetindo em ${retryDelay / 1000}s...`);
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }

    if (!this.connection) {
      throw new Error('Falha ao conectar ao RabbitMQ após várias tentativas.');
    }
  }

  async publishNotification(notification: any) {
    const messageBuffer = Buffer.from(JSON.stringify(notification));
    this.channel.publish(this.exchange, 'notifications_key', messageBuffer, {
      persistent: true,
    });
  }

  // Verifica se a conexão com o RabbitMQ está funcionando
  checkConnection() {
    if (!this.connection || !this.channel) {
      throw new Error('RabbitMQ não está conectado.');
    }
  }
}
