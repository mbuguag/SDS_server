import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaListQueryDto } from './dto/media.dto';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { Prisma } from '@prisma/client';

export type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class MediaService {
  private readonly uploadDir =
    process.env.MEDIA_UPLOAD_DIR ?? join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {}

  async list(query: MediaListQueryDto) {
    const { search, mimeType, page = 1, pageSize = 16 } = query;
    const where: Prisma.MediaAssetWhereInput = {};
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (mimeType) {
      where.mimeType = { contains: mimeType, mode: 'insensitive' };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async upload(file: UploadFile, userId?: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    await mkdir(this.uploadDir, { recursive: true });
    const extension = file.originalname.split('.').pop();
    const filename = `${Date.now()}-${randomUUID()}${extension ? `.${extension}` : ''}`;
    const filePath = join(this.uploadDir, filename);
    await writeFile(filePath, file.buffer);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        url: `/uploads/${filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        createdBy: userId ? { connect: { id: userId } } : undefined,
      },
    });
    return asset;
  }

  async delete(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Media asset ${id} not found`);
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
    const relative = asset.url.replace(/^\/?uploads\//, '');
    const filePath = join(this.uploadDir, relative);
    await unlink(filePath).catch(() => undefined);
    return { success: true };
  }
}
