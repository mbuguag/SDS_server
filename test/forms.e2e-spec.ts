import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';

describe('Forms API (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: {
    contactRequest: {
      create: jest.Mock;
      delete: jest.Mock;
    };
    subscriber: {
      create: jest.Mock;
      delete: jest.Mock;
    };
  };
  let mailServiceMock: {
    sendMail: jest.Mock;
  };

  beforeEach(async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.JWT_SECRET = 'test-secret';

    prismaMock = {
      contactRequest: {
        create: jest.fn().mockResolvedValue({
          id: 'contact-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Need help with AV setup',
        }),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      subscriber: {
        create: jest.fn().mockResolvedValue({
          id: 'subscriber-1',
          email: 'subscriber@example.com',
        }),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    mailServiceMock = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MailService)
      .useValue(mailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.ADMIN_EMAIL;
    delete process.env.JWT_SECRET;
  });

  it('accepts a valid contact request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/contact')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Need help with AV setup',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 'contact-1',
      email: 'jane@example.com',
    });
    expect(prismaMock.contactRequest.create).toHaveBeenCalledWith({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Need help with AV setup',
      },
    });
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid contact request payload', async () => {
    await request(app.getHttpServer())
      .post('/api/contact')
      .set('X-Forwarded-For', '203.0.113.11')
      .send({
        name: '',
        email: 'not-an-email',
        message: '',
      })
      .expect(400);

    expect(prismaMock.contactRequest.create).not.toHaveBeenCalled();
  });

  it('rate limits repeated contact submissions from the same IP', async () => {
    const client = request(app.getHttpServer());
    const ip = '203.0.113.12';

    for (let index = 0; index < 5; index += 1) {
      await client
        .post('/api/contact')
        .set('X-Forwarded-For', ip)
        .send({
          name: `Jane Doe ${index}`,
          email: `jane${index}@example.com`,
          message: 'Need help with AV setup',
        })
        .expect(201);
    }

    await client
      .post('/api/contact')
      .set('X-Forwarded-For', ip)
      .send({
        name: 'Jane Doe',
        email: 'jane6@example.com',
        message: 'Need help with AV setup',
      })
      .expect(429);
  });

  it('returns 500 and rolls back contact records when mail sending fails', async () => {
    mailServiceMock.sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    await request(app.getHttpServer())
      .post('/api/contact')
      .set('X-Forwarded-For', '203.0.113.13')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Need help with AV setup',
      })
      .expect(500);

    expect(prismaMock.contactRequest.delete).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    });
  });

  it('accepts a valid subscriber request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/subscribers')
      .set('X-Forwarded-For', '203.0.113.20')
      .send({
        email: 'subscriber@example.com',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 'subscriber-1',
      email: 'subscriber@example.com',
    });
    expect(prismaMock.subscriber.create).toHaveBeenCalledWith({
      data: {
        email: 'subscriber@example.com',
      },
    });
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid subscriber payload', async () => {
    await request(app.getHttpServer())
      .post('/api/subscribers')
      .set('X-Forwarded-For', '203.0.113.21')
      .send({
        email: 'bad-email',
      })
      .expect(400);

    expect(prismaMock.subscriber.create).not.toHaveBeenCalled();
  });

  it('rate limits repeated subscriber submissions from the same IP', async () => {
    const client = request(app.getHttpServer());
    const ip = '203.0.113.22';

    for (let index = 0; index < 5; index += 1) {
      await client
        .post('/api/subscribers')
        .set('X-Forwarded-For', ip)
        .send({
          email: `subscriber${index}@example.com`,
        })
        .expect(201);
    }

    await client
      .post('/api/subscribers')
      .set('X-Forwarded-For', ip)
      .send({
        email: 'subscriber6@example.com',
      })
      .expect(429);
  });

  it('returns 500 and rolls back subscriber records when mail sending fails', async () => {
    mailServiceMock.sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    await request(app.getHttpServer())
      .post('/api/subscribers')
      .set('X-Forwarded-For', '203.0.113.23')
      .send({
        email: 'subscriber@example.com',
      })
      .expect(500);

    expect(prismaMock.subscriber.delete).toHaveBeenCalledWith({
      where: { id: 'subscriber-1' },
    });
  });
});
