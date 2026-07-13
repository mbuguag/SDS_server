import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';

describe('SubscribersController', () => {
  let controller: SubscribersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscribersController],
      providers: [
        {
          provide: SubscribersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            deactivate: jest.fn(),
            remove: jest.fn(),
          },
        },
        RateLimitGuard,
        Reflector,
        RateLimitService,
      ],
    }).compile();

    controller = module.get<SubscribersController>(SubscribersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
