import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SolutionsController } from './solutions.controller';
import { SolutionsPublicController } from './solutions-public.controller';
import { SolutionsService } from './solutions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SolutionsController, SolutionsPublicController],
  providers: [SolutionsService],
})
export class SolutionsModule {}
