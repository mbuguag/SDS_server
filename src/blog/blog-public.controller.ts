import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { PublicListPostsQueryDto } from './dto/public-blog.dto';

@Controller('public/blog')
export class BlogPublicController {
  constructor(private readonly blogService: BlogService) {}

  @Get('posts')
  listPublishedPosts(@Query() query: PublicListPostsQueryDto) {
    return this.blogService.findPublishedPosts(query);
  }

  @Get('posts/:slug')
  findPublishedPost(@Param('slug') slug: string) {
    return this.blogService.findPublishedPostBySlug(slug);
  }

  @Post('posts/:slug/view')
  incrementView(@Param('slug') slug: string) {
    return this.blogService.incrementPostView(slug);
  }

  @Get('categories')
  listCategories() {
    return this.blogService.findPublicCategories();
  }

  @Get('tags')
  listTags() {
    return this.blogService.findPublicTags();
  }
}
