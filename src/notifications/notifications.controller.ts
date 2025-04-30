import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    return await this.notificationsService.create(dto);
  }

  @Get()
  async findAll() {
    return await this.notificationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return notification;
  }

  @Get('status/:id')
  async findStatus(@Param('id') id: string) {
    const status = await this.notificationsService.findStatus(id);
    if (!status) throw new NotFoundException('Status não encontrado');
    return status;
  }
}
