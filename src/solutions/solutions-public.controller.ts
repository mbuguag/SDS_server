import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListSolutionsQueryDto } from './dto/solutions.dto';
import { SolutionsService } from './solutions.service';

@Controller('public/solutions')
export class SolutionsPublicController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get()
  listPublished(@Query() query: ListSolutionsQueryDto) {
    return this.solutionsService.findPublished(query);
  }

  @Get(':slug')
  findPublished(@Param('slug') slug: string) {
    return this.solutionsService.findPublishedBySlug(slug);
  }
}
