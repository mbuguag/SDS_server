import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ContactController],
  providers: [ContactService, RateLimitService, RateLimitGuard],
})
export class ContactModule {}
