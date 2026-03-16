import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPublicController } from './blog-public.controller';
import { BlogScheduler } from './blog.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [BlogController, BlogPublicController],
  providers: [BlogService, BlogScheduler],
})
export class BlogModule {}
