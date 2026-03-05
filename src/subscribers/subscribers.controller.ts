import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('subscribers')
export class SubscribersController {
  constructor(private subscribersService: SubscribersService) {}

  @Post()
  create(@Body() dto: CreateSubscriberDto) {
    return this.subscribersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.subscribersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.subscribersService.deactivate(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscribersService.remove(id);
  }
}
