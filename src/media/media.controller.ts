import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MediaService } from './media.service';
import type { UploadFile } from './media.service';
import { MediaListQueryDto } from './dto/media.dto';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  list(@Query() query: MediaListQueryDto) {
    return this.mediaService.list(query);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  upload(@UploadedFile() file: UploadFile) {
    return this.mediaService.upload(file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }
}
