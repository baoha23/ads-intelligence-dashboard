import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('overview')
  async overview(@Query('from') from?: string, @Query('to') to?: string) {
    const range = normalizeDateRange(from, to);
    const rows = await this.metrics.getCampaignMetrics(range);

    return {
      dateRange: {
        from: range.from.toISOString().slice(0, 10),
        to: range.to.toISOString().slice(0, 10),
      },
      totalCampaigns: rows.length,
      totalRevenue: round(rows.reduce((sum, row) => sum + row.revenue, 0)),
      totalCost: round(rows.reduce((sum, row) => sum + row.cost, 0)),
      totalClicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      totalImpressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      topCampaigns: rows.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }

  @Get('trend')
  trend(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metrics.getDailyTrend(normalizeDateRange(from, to));
  }
}

function normalizeDateRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end);
  if (!from) start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
