import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlogService } from './blog.service';

@Injectable()
export class BlogScheduler {
  private readonly logger = new Logger(BlogScheduler.name);

  constructor(private readonly blogService: BlogService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledPosts() {
    const result = await this.blogService.publishDuePosts();
    if (result.updated > 0) {
      this.logger.log(`Published ${result.updated} scheduled post(s).`);
    }
  }
}
