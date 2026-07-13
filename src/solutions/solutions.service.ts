import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma, SolutionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSolutionDto,
  ListSolutionsQueryDto,
  UpdateSolutionDto,
} from './dto/solutions.dto';

@Injectable()
export class SolutionsService {
  constructor(private prisma: PrismaService) {}

  async findPublished(query: ListSolutionsQueryDto = {}) {
    return this.findAll({
      ...query,
      status: PostStatus.PUBLISHED,
    });
  }

  async findPublishedBySlug(slug: string) {
    const solution = await this.prisma.solution.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
    });
    if (!solution) {
      throw new NotFoundException(`Published solution ${slug} not found`);
    }
    return solution;
  }

  async findAll(query: ListSolutionsQueryDto = {}) {
    const {
      type,
      status,
      search,
      page = 1,
      pageSize = 50,
    } = query;
    const where: Prisma.SolutionWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.solution.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.solution.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const solution = await this.prisma.solution.findUnique({ where: { id } });
    if (!solution) throw new NotFoundException(`Solution ${id} not found`);
    return solution;
  }

  async create(dto: CreateSolutionDto) {
    const existing = await this.prisma.solution.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already in use');

    return this.prisma.solution.create({
      data: this.toSolutionData(dto),
    });
  }

  async update(id: string, dto: UpdateSolutionDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.solution.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug already in use');
    }

    return this.prisma.solution.update({
      where: { id },
      data: this.toSolutionData(dto),
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.solution.delete({ where: { id } });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.solution.update({
      where: { id },
      data: { status: PostStatus.PUBLISHED },
    });
  }

  private toSolutionData(dto: UpdateSolutionDto): Prisma.SolutionUncheckedCreateInput {
    return {
      type: dto.type ?? SolutionType.SERVICE,
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      heroTitle: dto.heroTitle,
      heroDescription: dto.heroDescription,
      heroMedia: this.jsonValue(dto.heroMedia),
      icon: dto.icon,
      overview: dto.overview,
      challenges: this.jsonValue(dto.challenges),
      capabilities: this.jsonValue(dto.capabilities),
      process: this.jsonValue(dto.process),
      differentiators: this.jsonValue(dto.differentiators),
      useCases: this.jsonValue(dto.useCases),
      outcomes: this.jsonValue(dto.outcomes),
      faqs: this.jsonValue(dto.faqs),
      visualGallery: this.jsonValue(dto.visualGallery),
      gallery: this.jsonValue(dto.gallery),
      status: dto.status,
      sortOrder: dto.sortOrder,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      canonicalUrl: dto.canonicalUrl,
    };
  }

  private jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) return undefined;
    return value as Prisma.InputJsonValue;
  }
}
