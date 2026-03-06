import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriberDto) {
    try {
      return await this.prisma.subscriber.create({
        data: dto,
      });
    } catch {
      throw new ConflictException('Subscriber with this email already exists');
    }
  }

  async findAll() {
    return await this.prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string) {
    return this.prisma.subscriber.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async remove(id: string) {
    return this.prisma.subscriber.delete({
      where: { id },
    });
  }
}
