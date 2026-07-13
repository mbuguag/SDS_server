import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
    let subscriber: { id: string; email: string } | null = null;

    if (!process.env.ADMIN_EMAIL) {
      throw new InternalServerErrorException(
        'Subscriber service email is not configured.',
      );
    }

    try {
      subscriber = await this.prisma.subscriber.create({
        data: dto,
      });

      await this.mailService.sendMail(
        process.env.ADMIN_EMAIL,
        'New Subscriber',
        subscriberNotificationTemplate(subscriber.email),
      );

      await this.mailService.sendMail(
        subscriber.email,
        'Welcome to Smoothtel',
        subscriberWelcome(),
      );

      return subscriber;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (!subscriber) {
        throw new ConflictException('Subscriber with this email already exists');
      }

      this.logger.error('Subscriber emails failed to send', error);

      await this.prisma.subscriber
        .delete({ where: { id: subscriber.id } })
        .catch((rollbackError) => {
          this.logger.error(
            'Failed to roll back subscriber after mail failure',
            rollbackError,
          );
        });

      throw new InternalServerErrorException(
        'Unable to process subscription at this time.',
      );
    }
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
