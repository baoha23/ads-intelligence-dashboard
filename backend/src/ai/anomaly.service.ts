import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyDto, detectMetric } from './anomalyDetect';

@Injectable()
export class AnomalyService {
  constructor(private readonly prisma: PrismaService) {}

  async detect(range: { from: Date; to: Date }): Promise<AnomalyDto[]> {
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

    return campaigns.flatMap((campaign) => {
      const rows = campaign.records.map((record) => ({
        date: record.date.toISOString().slice(0, 10),
        revenue: Number(record.revenue),
        clicks: record.clicks,
        cpm: record.impressions > 0 ? (Number(record.cost) / record.impressions) * 1000 : 0,
      }));

      return [
        ...detectMetric(campaign.id, campaign.name, rows, 'revenue'),
        ...detectMetric(campaign.id, campaign.name, rows, 'clicks'),
        ...detectMetric(campaign.id, campaign.name, rows, 'cpm'),
      ];
    });
  }
}
