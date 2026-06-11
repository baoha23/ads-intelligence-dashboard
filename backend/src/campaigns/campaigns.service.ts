import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  list(filters: { adType?: string; upstream?: string; downstream?: string }) {
    return this.prisma.campaign.findMany({
      where: {
        adType: filters.adType || undefined,
        upstream: filters.upstream || undefined,
        downstream: filters.downstream || undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });
  }

  async detail(id: string, range: { from?: string; to?: string }) {
    const dateFilter = buildDateFilter(range);

    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        records: {
          where: dateFilter ? { date: dateFilter } : undefined,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { records: true } } },
    });

    if (!existing) {
      return { deleted: false, reason: 'not_found' as const };
    }

    await this.prisma.campaign.delete({ where: { id } });

    return {
      deleted: true,
      campaignId: id,
      campaignName: existing.name,
      recordsDeleted: existing._count.records,
    };
  }
}

function buildDateFilter(range: { from?: string; to?: string }) {
  if (!range.from && !range.to) return undefined;

  return {
    gte: range.from ? startOfDay(range.from) : undefined,
    lte: range.to ? endOfDay(range.to) : undefined,
  };
}

function startOfDay(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
