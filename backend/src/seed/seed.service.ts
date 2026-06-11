import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SampleDataOptions {
  campaigns?: number;
  days?: number;
  injectAnomaly?: boolean;
  startFresh?: boolean;
}

export interface SampleDataResult {
  campaignsCreated: number;
  recordsCreated: number;
  anomaliesInjected: number;
}

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSampleData(options: SampleDataOptions = {}): Promise<SampleDataResult> {
    const {
      campaigns: campaignCount = 3,
      days = 14,
      injectAnomaly = true,
      startFresh = false,
    } = options;

    if (startFresh) {
      await this.prisma.dailyRecord.deleteMany();
      await this.prisma.campaign.deleteMany();
    }

    const adTypes = ['CPM', 'CPA', 'CPS'];
    const upstreams = ['Upstream 1', 'Upstream 2', 'Upstream 3'];
    const downstreams = ['Downstream 1', 'Downstream 2', 'Downstream 3', 'Downstream 4'];

    const existingCount = await this.prisma.campaign.count();
    const newCampaigns = await Promise.all(
      Array.from({ length: campaignCount }, (_, index) =>
        this.prisma.campaign.create({
          data: {
            name: `Campaign ${String.fromCharCode(65 + existingCount + index)}`,
            adType: adTypes[(existingCount + index) % adTypes.length],
            upstream: upstreams[(existingCount + index) % upstreams.length],
            downstream: downstreams[(existingCount + index) % downstreams.length],
          },
        }),
      ),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let recordsCreated = 0;
    let anomaliesInjected = 0;

    for (let dayOffset = days - 1; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      for (const [campaignIndex, campaign] of newCampaigns.entries()) {
        const baseRevenue = 1500 + campaignIndex * 600;
        const baseCost = 900 + campaignIndex * 350;
        const baseImpressions = 10000 + campaignIndex * 2500;
        const baseClicks = 800 + campaignIndex * 120;

        const randomFactor = 0.85 + Math.random() * 0.3;
        const trendFactor = 1 + (days - dayOffset) * 0.01;

        const shouldInjectAnomaly =
          injectAnomaly && dayOffset === 1 && campaignIndex === 0 && Math.random() < 0.5;
        const anomalyMultiplier = shouldInjectAnomaly ? 3.2 : 1;
        const costAnomalyMultiplier = shouldInjectAnomaly ? 2.4 : 1;

        if (shouldInjectAnomaly) anomaliesInjected += 1;

        const shouldInjectClickDrop = injectAnomaly && dayOffset <= 2 && campaignIndex === 1 && Math.random() < 0.5;
        const clickDrop = shouldInjectClickDrop ? (3 - dayOffset) * 180 : 0;

        await this.prisma.dailyRecord.create({
          data: {
            campaignId: campaign.id,
            date,
            impressions: Math.round(baseImpressions * randomFactor * trendFactor * anomalyMultiplier),
            clicks: Math.max(50, Math.round((baseClicks + dayOffset * 15 - clickDrop) * randomFactor)),
            revenue: Math.round(baseRevenue * randomFactor * trendFactor * anomalyMultiplier * 100) / 100,
            cost: Math.round(baseCost * randomFactor * trendFactor * costAnomalyMultiplier * 100) / 100,
          },
        });
        recordsCreated += 1;
      }
    }

    return {
      campaignsCreated: newCampaigns.length,
      recordsCreated,
      anomaliesInjected,
    };
  }
}
