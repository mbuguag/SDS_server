import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  BulkStatusDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCategoryDto,
  CreateTagDto,
  ListPostsQueryDto,
} from './dto/blog.dto';
import { PublicListPostsQueryDto } from './dto/public-blog.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  private readonly postInclude = {
    author: { select: { id: true, email: true } },
    category: { select: { id: true, name: true, slug: true } },
    tags: {
      include: { tag: { select: { id: true, name: true, slug: true } } },
    },
    coverImage: true,
    ogImage: true,
    attachments: { include: { media: true } },
  } satisfies Prisma.PostInclude;

  async findPublishedPosts(query: PublicListPostsQueryDto) {
    const adminQuery: ListPostsQueryDto = {
      ...query,
      status: PostStatus.PUBLISHED,
    };
    return this.findAllPosts(adminQuery);
  }

  async findPublishedPostBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      include: this.postInclude,
    });
    if (!post) throw new NotFoundException(`Published post ${slug} not found`);
    return post;
  }

  async findAllPosts(query: ListPostsQueryDto) {
    const {
      status,
      categoryId,
      categorySlug,
      tagId,
      tagSlug,
      search,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
      sort = 'newest',
    } = query;

    const where: Prisma.PostWhereInput = {};
    if (status) where.status = status;
    if (categoryId) {
      where.categoryId = categoryId || null;
    } else if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (tagId) {
      where.tags = { some: { tagId } };
    } else if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      };
    }

    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    if (sort === 'scheduled') {
      orderBy.push({ scheduledAt: 'asc' });
    } else if (sort === 'oldest') {
      orderBy.push({ createdAt: 'asc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: this.postInclude,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOnePost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postInclude,
    });
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  async createPost(dto: CreatePostDto, authorId: string) {
    const existing = await this.prisma.post.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already in use');

    const {
      tagIds,
      categoryId,
      coverImageId,
      ogImageId,
      attachmentIds,
      scheduledAt,
      contentBlocks,
      ...data
    } = dto;

    return this.prisma.post.create({
      data: {
        ...data,
        publishedAt:
          dto.status === PostStatus.PUBLISHED ? new Date() : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        contentBlocks: this.normalizeContentBlocks(contentBlocks),
        author: { connect: { id: authorId } },
        category: this.resolveCategoryRelation(categoryId),
        coverImage: this.resolveMediaRelation(coverImageId),
        ogImage: this.resolveMediaRelation(ogImageId),
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        attachments: this.buildAttachmentCreate(attachmentIds),
      },
      include: this.postInclude,
    });
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    await this.findOnePost(id);

    if (dto.slug) {
      const existing = await this.prisma.post.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug already in use');
    }

    const {
      tagIds,
      categoryId,
      coverImageId,
      ogImageId,
      attachmentIds,
      scheduledAt,
      contentBlocks,
      ...data
    } = dto;

    return this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          dto.status === PostStatus.PUBLISHED ? new Date() : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        contentBlocks: this.normalizeContentBlocks(contentBlocks),
        category: this.resolveCategoryRelation(categoryId, true),
        coverImage: this.resolveMediaRelation(coverImageId, true),
        ogImage: this.resolveMediaRelation(ogImageId, true),
        tags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        attachments: attachmentIds
          ? {
              deleteMany: {},
              create: attachmentIds.map((mediaId) => ({
                media: { connect: { id: mediaId } },
              })),
            }
          : undefined,
      },
      include: this.postInclude,
    });
  }

  async deletePost(id: string) {
    await this.findOnePost(id);
    return this.prisma.post.delete({ where: { id } });
  }

  async publishPost(id: string) {
    await this.findOnePost(id);
    return this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.PUBLISHED, publishedAt: new Date() },
      include: this.postInclude,
    });
  }

  async autosavePost(id: string, dto: UpdatePostDto) {
    const {
      tagIds,
      categoryId,
      coverImageId,
      ogImageId,
      attachmentIds,
      scheduledAt,
      contentBlocks,
      ...data
    } = dto;
    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        publishedAt: undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        contentBlocks: this.normalizeContentBlocks(contentBlocks),
        coverImage: this.resolveMediaRelation(coverImageId, true),
        ogImage: this.resolveMediaRelation(ogImageId, true),
        category: this.resolveCategoryRelation(categoryId, true),
        attachments: attachmentIds
          ? {
              deleteMany: {},
              create: attachmentIds.map((mediaId) => ({
                media: { connect: { id: mediaId } },
              })),
            }
          : undefined,
        tags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: this.postInclude,
    });
    await this.prisma.postRevision.create({
      data: {
        postId: id,
        content: dto.content ?? updated.content,
        contentBlocks: this.normalizeContentBlocks(
          dto.contentBlocks ?? updated.contentBlocks ?? undefined,
        ),
      },
    });
    return updated;
  }

  async bulkUpdateStatus(dto: BulkStatusDto) {
    await this.prisma.post.updateMany({
      where: { id: { in: dto.ids } },
      data: {
        status: dto.status,
        publishedAt: dto.status === PostStatus.PUBLISHED ? new Date() : null,
      },
    });
    return this.prisma.post.findMany({
      where: { id: { in: dto.ids } },
      include: this.postInclude,
    });
  }

  previewPost(dto: CreatePostDto) {
    const wordCount = dto.content
      ? dto.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
      : 0;
    const readingTime = dto.readingTime ?? Math.max(1, Math.ceil(wordCount / 200));
    return { html: dto.content, readingTime };
  }

  async incrementPostView(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      select: { id: true, viewCount: true },
    });
    if (!post) {
      throw new NotFoundException(`Published post ${slug} not found`);
    }
    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
    return updated;
  }

  async findPublicCategories() {
    const categories = await this.prisma.category.findMany({
      where: { posts: { some: { status: PostStatus.PUBLISHED } } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        posts: {
          where: { status: PostStatus.PUBLISHED },
          select: { id: true },
        },
      },
    });
    return categories.map(({ posts, ...category }) => ({
      ...category,
      publishedCount: posts.length,
    }));
  }

  async findPublicTags() {
    const tags = await this.prisma.tag.findMany({
      where: { posts: { some: { post: { status: PostStatus.PUBLISHED } } } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        posts: {
          where: { post: { status: PostStatus.PUBLISHED } },
          select: { postId: true },
        },
      },
    });
    return tags.map(({ posts, ...tag }) => ({
      ...tag,
      publishedCount: posts.length,
    }));
  }

  async publishDuePosts() {
    const duePosts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      select: { id: true },
    });
    if (!duePosts.length) {
      return { updated: 0 };
    }
    const ids = duePosts.map((post) => post.id);
    const now = new Date();
    await this.prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { status: PostStatus.PUBLISHED, publishedAt: now },
    });
    return { updated: ids.length };
  }

  // ── Categories ─────────────────────────────────────────────

  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug: dto.slug }] },
    });
    if (existing)
      throw new ConflictException('Category name or slug already exists');

    return this.prisma.category.create({ data: dto });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // ── Tags ────────────────────────────────────────────────────

  async findAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async createTag(dto: CreateTagDto) {
    const existing = await this.prisma.tag.findFirst({
      where: { OR: [{ name: dto.name }, { slug: dto.slug }] },
    });
    if (existing)
      throw new ConflictException('Tag name or slug already exists');

    return this.prisma.tag.create({ data: dto });
  }

  async deleteTag(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }

  private resolveMediaRelation(id?: string | null, allowDisconnect = false) {
    if ((id === null || id === '') && allowDisconnect) {
      return { disconnect: true };
    }
    if (id) {
      return { connect: { id } };
    }
    return undefined;
  }

  private resolveCategoryRelation(id?: string | null, allowDisconnect = false) {
    if ((id === null || id === '') && allowDisconnect) {
      return { disconnect: true };
    }
    if (id) {
      return { connect: { id } };
    }
    return undefined;
  }

  private buildAttachmentCreate(ids?: string[]) {
    return ids?.length
      ? {
          create: ids.map((mediaId) => ({
            media: { connect: { id: mediaId } },
          })),
        }
      : undefined;
  }

  private normalizeContentBlocks(value?: unknown) {
    if (value === undefined) {
      return undefined;
    }
    return value as Prisma.InputJsonValue;
  }
}
