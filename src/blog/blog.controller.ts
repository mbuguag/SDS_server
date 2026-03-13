import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BlogService } from './blog.service';
import {
  BulkStatusDto,
  CreateCategoryDto,
  CreatePostDto,
  CreateTagDto,
  ListPostsQueryDto,
  UpdatePostDto,
} from './dto/blog.dto';

@UseGuards(JwtAuthGuard)
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  private getUserId(req: Request): string {
    const user = req.user as { id?: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid user context');
    }

    return user.id;
  }

  @Get('posts')
  findAllPosts(@Query() query: ListPostsQueryDto) {
    return this.blogService.findAllPosts(query);
  }

  @Get('posts/:id')
  findOnePost(@Param('id') id: string) {
    return this.blogService.findOnePost(id);
  }

  @Post('posts')
  createPost(@Body() dto: CreatePostDto, @Req() req: Request) {
    return this.blogService.createPost(dto, this.getUserId(req));
  }

  @Patch('posts/:id')
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Patch('posts/:id/autosave')
  autosavePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.autosavePost(id, dto);
  }

  @Patch('posts/:id/publish')
  publishPost(@Param('id') id: string) {
    return this.blogService.publishPost(id);
  }

  @Patch('posts/bulk-status')
  bulkStatus(@Body() dto: BulkStatusDto) {
    return this.blogService.bulkUpdateStatus(dto);
  }

  @Post('posts/preview')
  previewPost(@Body() dto: CreatePostDto) {
    return this.blogService.previewPost(dto);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  @Get('categories')
  findAllCategories() {
    return this.blogService.findAllCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.blogService.deleteCategory(id);
  }

  @Get('tags')
  findAllTags() {
    return this.blogService.findAllTags();
  }

  @Post('tags')
  createTag(@Body() dto: CreateTagDto) {
    return this.blogService.createTag(dto);
  }

  @Delete('tags/:id')
  deleteTag(@Param('id') id: string) {
    return this.blogService.deleteTag(id);
  }
}
