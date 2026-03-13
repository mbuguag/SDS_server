import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardMetrics() {
    return this.analyticsService.getDashboardMetrics();
  }

  @Get('activity')
  getRecentActivity() {
    return this.analyticsService.getRecentActivity();
  }
}
