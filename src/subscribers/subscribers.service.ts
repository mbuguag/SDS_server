import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { MailService } from '../mail/mail.service';
import { subscriberWelcome } from '../mail/templates/subscriber-welcome';
import { subscriberNotificationTemplate } from '../mail/templates/subscriber-notification';

@Injectable()
export class SubscribersService {
  private readonly logger = new Logger(SubscribersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateSubscriberDto) {
    let subscriber: { email: string };

    try {
      subscriber = await this.prisma.subscriber.create({
        data: dto,
      });
    } catch {
      throw new ConflictException('Subscriber with this email already exists');
    }

    if (process.env.ADMIN_EMAIL) {
      this.mailService
        .sendMail(
          process.env.ADMIN_EMAIL,
          'New Subscriber',
          subscriberNotificationTemplate(subscriber.email),
        )
        .catch(() => {});
    } else {
      this.logger.warn('ADMIN_EMAIL is not set; skipping admin notification');
    }

    this.mailService
      .sendMail(subscriber.email, 'Welcome to Smoothtel', subscriberWelcome())
      .catch(() => {});

    return subscriber;
  }

  async findAll() {
    return await this.prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string) {
    return this.prisma.subscriber.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async remove(id: string) {
    return this.prisma.subscriber.delete({
      where: { id },
    });
  }
}
