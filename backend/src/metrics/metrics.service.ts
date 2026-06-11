import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface CampaignMetricRow {
  campaignId: string;
  campaignName: string;
  adType: string;
  upstream: string;
  downstream: string;
  revenue: number;
  cost: number;
  clicks: number;
  impressions: number;
  cpm: number | null;
  cpa: number | null;
  cps: number | null;
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopCampaignsByRevenue(range: DateRange, limit = 5): Promise<CampaignMetricRow[]> {
    const rows = await this.getCampaignMetrics(range);
    return rows.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  async getHighestCpmCampaigns(range: DateRange, limit = 5): Promise<CampaignMetricRow[]> {
    const rows = await this.getCampaignMetrics(range);
    return rows
      .filter((row) => row.cpm !== null)
      .sort((a, b) => (b.cpm ?? 0) - (a.cpm ?? 0))
      .slice(0, limit);
  }

  async getRevenueByAdType(range: DateRange) {
    const rows = await this.getCampaignMetrics(range);
    const totals = new Map<string, { adType: string; revenue: number; cost: number; clicks: number; impressions: number }>();

    for (const row of rows) {
      const current = totals.get(row.adType) ?? {
        adType: row.adType,
        revenue: 0,
        cost: 0,
        clicks: 0,
        impressions: 0,
      };
      current.revenue += row.revenue;
      current.cost += row.cost;
      current.clicks += row.clicks;
      current.impressions += row.impressions;
      totals.set(row.adType, current);
    }

    return [...totals.values()].sort((a, b) => b.revenue - a.revenue);
  }

  async compareRevenue(current: DateRange, previous: DateRange) {
    const [currentRows, previousRows] = await Promise.all([this.getCampaignMetrics(current), this.getCampaignMetrics(previous)]);
    const currentRevenue = sum(currentRows, 'revenue');
    const previousRevenue = sum(previousRows, 'revenue');
    const delta = round(currentRevenue - previousRevenue);
    const deltaPercent = previousRevenue === 0 ? null : round((delta / previousRevenue) * 100);

    return {
      currentRevenue,
      previousRevenue,
      delta,
      deltaPercent,
    };
  }

  async getDecliningClicksCampaigns(range: DateRange) {
    const campaigns = await this.prisma.campaign.findMany({
      include: {
        records: {
          where: {
            date: {
              gte: range.from,
              lte: range.to,
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    return campaigns
      .map((campaign) => {
        const dailyClicks = campaign.records.map((record) => ({
          date: record.date.toISOString().slice(0, 10),
          clicks: record.clicks,
        }));
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          adType: campaign.adType,
          dailyClicks,
          isDeclining: hasStrictDecline(dailyClicks.map((item) => item.clicks)),
        };
      })
      .filter((campaign) => campaign.isDeclining);
  }

  async getCampaignSummary(range: DateRange, campaignName?: string) {
    const rows = await this.getCampaignMetrics(range);
    const normalizedName = campaignName?.toLowerCase();
    const target = normalizedName
      ? rows.find((row) => row.campaignName.toLowerCase().includes(normalizedName))
      : rows.sort((a, b) => b.revenue - a.revenue)[0];

    if (!target) return null;

    const records = await this.prisma.dailyRecord.findMany({
      where: {
        campaignId: target.campaignId,
        date: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      ...target,
      dailyRecords: records.map((record) => ({
        date: record.date.toISOString().slice(0, 10),
        revenue: Number(record.revenue),
        cost: Number(record.cost),
        clicks: record.clicks,
        impressions: record.impressions,
      })),
    };
  }

  async getDailyTrend(range: DateRange) {
    const records = await this.prisma.dailyRecord.findMany({
      where: {
        date: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: { date: 'asc' },
    });

    const byDate = new Map<string, { date: string; revenue: number; cost: number; clicks: number; impressions: number }>();

    for (const record of records) {
      const date = record.date.toISOString().slice(0, 10);
      const current = byDate.get(date) ?? { date, revenue: 0, cost: 0, clicks: 0, impressions: 0 };
      current.revenue += Number(record.revenue);
      current.cost += Number(record.cost);
      current.clicks += record.clicks;
      current.impressions += record.impressions;
      byDate.set(date, current);
    }

    return [...byDate.values()].map((row) => ({
      ...row,
      revenue: round(row.revenue),
      cost: round(row.cost),
    }));
  }

  async getCampaignMetrics(range: DateRange): Promise<CampaignMetricRow[]> {
    const campaigns = await this.prisma.campaign.findMany({
      include: {
        records: {
          where: {
            date: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const totals = campaign.records.reduce(
        (acc, record) => {
          acc.revenue += Number(record.revenue);
          acc.cost += Number(record.cost);
          acc.clicks += record.clicks;
          acc.impressions += record.impressions;
          return acc;
        },
        { revenue: 0, cost: 0, clicks: 0, impressions: 0 },
      );

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        adType: campaign.adType,
        upstream: campaign.upstream,
        downstream: campaign.downstream,
        revenue: round(totals.revenue),
        cost: round(totals.cost),
        clicks: totals.clicks,
        impressions: totals.impressions,
        cpm: totals.impressions > 0 ? round((totals.cost / totals.impressions) * 1000) : null,
        cpa: totals.clicks > 0 ? round(totals.cost / totals.clicks) : null,
        cps: totals.clicks > 0 ? round(totals.revenue / totals.clicks) : null,
      };
    });
  }
}

function sum(rows: CampaignMetricRow[], key: 'revenue' | 'cost' | 'clicks' | 'impressions') {
  return round(rows.reduce((total, row) => total + row[key], 0));
}

function hasStrictDecline(values: number[]) {
  if (values.length < 3) return false;
  const recent = values.slice(-3);
  return recent[0] > recent[1] && recent[1] > recent[2];
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
