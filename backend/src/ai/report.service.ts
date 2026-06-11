import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { AnomalyService } from './anomaly.service';

export interface WeeklyReport {
  weekRange: { from: string; to: string };
  totals: {
    revenue: number;
    cost: number;
    clicks: number;
    impressions: number;
    campaigns: number;
  };
  topCampaigns: Array<{ campaignName: string; adType: string; revenue: number; cost: number }>;
  anomalies: Array<{ campaignName: string; date: string; metric: string; sigma: number }>;
  byAdType: Array<{ adType: string; revenue: number; cost: number }>;
}

@Injectable()
export class ReportService {
  constructor(
    private readonly metrics: MetricsService,
    private readonly anomalies: AnomalyService,
  ) {}

  async weeklyReport(weekEndDate?: string): Promise<WeeklyReport> {
    const end = weekEndDate ? new Date(weekEndDate) : new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const range = { from: start, to: end };
    const [rows, anomalyList] = await Promise.all([this.metrics.getCampaignMetrics(range), this.anomalies.detect(range)]);
    const byAdType = await this.metrics.getRevenueByAdType(range);

    const totals = {
      revenue: round(rows.reduce((sum, row) => sum + row.revenue, 0)),
      cost: round(rows.reduce((sum, row) => sum + row.cost, 0)),
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      campaigns: rows.length,
    };

    const topCampaigns = rows
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((row) => ({
        campaignName: row.campaignName,
        adType: row.adType,
        revenue: row.revenue,
        cost: row.cost,
      }));

    return {
      weekRange: { from: toDateOnly(start), to: toDateOnly(end) },
      totals,
      topCampaigns,
      anomalies: anomalyList.slice(0, 10).map((item) => ({
        campaignName: item.campaignName,
        date: item.date,
        metric: item.metric,
        sigma: item.sigma,
      })),
      byAdType,
    };
  }
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
