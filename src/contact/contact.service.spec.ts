import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: PrismaService,
          useValue: {
            contactRequest: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
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

    service = module.get<ContactService>(ContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
