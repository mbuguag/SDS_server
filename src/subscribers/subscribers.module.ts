import { Module } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [SubscribersService, RateLimitService, RateLimitGuard],
  controllers: [SubscribersController],
})
export class SubscribersModule {}
