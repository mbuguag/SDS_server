import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  CreateSolutionDto,
  ListSolutionsQueryDto,
  UpdateSolutionDto,
} from './dto/solutions.dto';
import { SolutionsService } from './solutions.service';

@UseGuards(JwtAuthGuard)
@Controller('solutions')
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get()
  findAll(@Query() query: ListSolutionsQueryDto) {
    return this.solutionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solutionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSolutionDto) {
    return this.solutionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSolutionDto) {
    return this.solutionsService.update(id, dto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.solutionsService.publish(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.solutionsService.delete(id);
  }
}
