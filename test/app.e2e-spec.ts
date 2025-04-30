import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Notifications API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/notifications (POST) deve criar uma notificação', async () => {
    const res = await request(app.getHttpServer())
      .post('/notifications')
      .send({
        userId: 'e2e-user',
        message: 'Teste E2E',
        type: 'email',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.userId).toBe('e2e-user');
  });

  it('/notifications (GET) deve retornar lista', async () => {
    const res = await request(app.getHttpServer()).get('/notifications');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
