import { Test, TestingModule } from '@nestjs/testing';
import { SubscribersService } from './subscribers.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('SubscribersService', () => {
  let service: SubscribersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribersService,
        {
          provide: PrismaService,
          useValue: {
            subscriber: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscribersService>(SubscribersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
