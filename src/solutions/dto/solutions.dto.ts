import { PostStatus, SolutionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSolutionDto {
  @IsOptional()
  @IsEnum(SolutionType)
  type?: SolutionType;

  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsString()
  @MinLength(1)
  summary: string;

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroDescription?: string;

  @IsOptional()
  @IsObject()
  heroMedia?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  challenges?: unknown;

  @IsOptional()
  capabilities?: unknown;

  @IsOptional()
  process?: unknown;

  @IsOptional()
  differentiators?: unknown;

  @IsOptional()
  useCases?: unknown;

  @IsOptional()
  outcomes?: unknown;

  @IsOptional()
  faqs?: unknown;

  @IsOptional()
  visualGallery?: unknown;

  @IsOptional()
  gallery?: unknown;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;
}

export class UpdateSolutionDto {
  @IsOptional()
  @IsEnum(SolutionType)
  type?: SolutionType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  summary?: string;

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroDescription?: string;

  @IsOptional()
  @IsObject()
  heroMedia?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  challenges?: unknown;

  @IsOptional()
  capabilities?: unknown;

  @IsOptional()
  process?: unknown;

  @IsOptional()
  differentiators?: unknown;

  @IsOptional()
  useCases?: unknown;

  @IsOptional()
  outcomes?: unknown;

  @IsOptional()
  faqs?: unknown;

  @IsOptional()
  visualGallery?: unknown;

  @IsOptional()
  gallery?: unknown;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;
}

export class ListSolutionsQueryDto {
  @IsOptional()
  @IsEnum(SolutionType)
  type?: SolutionType;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
