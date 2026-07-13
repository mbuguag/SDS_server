import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { SubscribersModule } from './subscribers/subscribers.module';
import { ContactModule } from './contact/contact.module';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BlogModule } from './blog/blog.module';
import { MediaModule } from './media/media.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SolutionsModule } from './solutions/solutions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PrismaModule,
    SubscribersModule,
    ContactModule,
    MailModule,
    AnalyticsModule,
    BlogModule,
    MediaModule,
    SolutionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
