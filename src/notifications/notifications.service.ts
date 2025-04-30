
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
  ) {}

  async create(data: Omit<Notification, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });

    // Envia a notificação para a fila do RabbitMQ
    await this.queue.publishNotification(notification);

    return notification;
  }

  findAll() {
    return this.prisma.notification.findMany();
  }

  findOne(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  findStatus(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }
}
