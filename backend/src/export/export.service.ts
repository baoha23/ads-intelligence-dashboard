import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from './csv';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async dailyRecordsCsv(range: { from: Date; to: Date }) {
    const records = await this.prisma.dailyRecord.findMany({
      where: {
        date: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: [{ date: 'asc' }, { campaign: { name: 'asc' } }],
      include: { campaign: true },
    });

    const rows = records.map((record) => [
      record.date.toISOString().slice(0, 10),
      record.campaign.name,
      record.campaign.adType,
      record.campaign.upstream,
      record.campaign.downstream,
      record.impressions,
      record.clicks,
      record.revenue,
      record.cost,
      record.cpm ?? '',
      record.cpa ?? '',
      record.cps ?? '',
    ]);

    return toCsv([
      ['date', 'campaign', 'adType', 'upstream', 'downstream', 'impressions', 'clicks', 'revenue', 'cost', 'cpm', 'cpa', 'cps'],
      ...rows,
    ]);
  }
}

function _unused() {
  // kept empty after refactor; CSV helpers live in ./csv.ts
}
