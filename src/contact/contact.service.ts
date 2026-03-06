import { Injectable, Logger } from '@nestjs/common';
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
    const contact = await this.prisma.contactRequest.create({
      data,
    });

    try {
      await this.mailService.sendMail(
        process.env.ADMIN_EMAIL!,
        'New Contact Request',
        contactNotificationTemplate(data.name, data.email, data.message),
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.mailService.sendMail(
        data.email,
        'We received your message',
        contactAutoReply(data.name),
      );
    } catch (error) {
      this.logger.error('Contact emails failed to send', error);
    }

    return contact;
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
