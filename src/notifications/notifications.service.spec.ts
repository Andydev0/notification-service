import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueue = {
    publishNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve criar uma notificação com status PENDING', async () => {
    const data = { userId: '123', message: 'Test', type: 'email' };
    const expected = { id: 'abc', ...data, status: 'PENDING' };

    mockPrisma.notification.create.mockResolvedValue(expected);

    const result = await service.create(data as any);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { ...data, status: 'PENDING' },
    });
    expect(result).toEqual(expected);
  });

  it('deve buscar todas as notificações', async () => {
    const expected = [{ id: '1' }, { id: '2' }];
    mockPrisma.notification.findMany.mockResolvedValue(expected);

    const result = await service.findAll();
    expect(result).toEqual(expected);
  });
});
