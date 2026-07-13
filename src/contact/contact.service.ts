import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto/create-contact.dto';
import { MailService } from '../mail/mail.service';
import { contactAutoReply } from '../mail/templates/contact-autoreply';
import { contactNotificationTemplate } from '../mail/templates/contact-notification';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(data: CreateContactDto) {
    let contact: { id: string } | null = null;

    try {
      if (!process.env.ADMIN_EMAIL) {
        throw new InternalServerErrorException(
          'Contact service email is not configured.',
        );
      }

      contact = await this.prisma.contactRequest.create({
        data,
      });

      await this.mailService.sendMail(
        process.env.ADMIN_EMAIL,
        'New Contact Request',
        contactNotificationTemplate(data.name, data.email, data.message),
      );

      await this.mailService.sendMail(
        data.email,
        'We received your message',
        contactAutoReply(data.name),
      );

      return contact;
    } catch (error) {
      this.logger.error('Contact emails failed to send', error);

      if (contact?.id) {
        await this.prisma.contactRequest
          .delete({ where: { id: contact.id } })
          .catch((rollbackError) => {
            this.logger.error(
              'Failed to roll back contact request after mail failure',
              rollbackError,
            );
          });
      }

      throw new InternalServerErrorException(
        'Unable to process contact request at this time.',
      );
    }
  }

  async findAll() {
    return this.prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markResponded(id: string) {
    return this.prisma.contactRequest.update({
      where: { id },
      data: { status: 'RESPONDED' },
    });
  }
}
