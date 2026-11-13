import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const TARGET_URL = 'https://example.com/landing';
const TEST_PASSWORD = 'password123';
const LOCAL_DATABASE = /localhost|127\.0\.0\.1/;

describe('click tracking (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e-${randomUUID()}@example.com`;

  beforeAll(async () => {
    // These tests create real rows, so never let them touch a cloud database
    if (!LOCAL_DATABASE.test(process.env.DATABASE_URL ?? '')) {
      throw new Error('e2e tests only run against a local database');
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // deleting the user also deletes their links and clicks (onDelete: Cascade)
    await app.get(PrismaService).user.deleteMany({ where: { email } });
    await app.close();
  });

  it('records a click when a short link is opened', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/auth/register')
      .send({ email, password: TEST_PASSWORD })
      .expect(201);
    const { body: login } = await request(server)
      .post('/auth/login')
      .send({ email, password: TEST_PASSWORD })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.accessToken}` };
    const { body: link } = await request(server)
      .post('/links')
      .set(auth)
      .send({ url: TARGET_URL })
      .expect(201);

    await request(server)
      .get(`/${link.slug}`)
      .set('Referer', 'https://news.example.org')
      .expect(302)
      .expect('Location', TARGET_URL);

    // the click is saved by an event listener, so it can land a moment after the redirect
    await vi.waitFor(async () => {
      const { body: stats } = await request(server)
        .get(`/links/${link.id}/stats`)
        .set(auth)
        .expect(200);
      expect(stats.total).toBe(1);
      expect(stats.topReferrers).toEqual([
        { referrer: 'https://news.example.org', count: 1 },
      ]);
    });
  });
});
