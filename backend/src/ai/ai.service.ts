import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { MetricsService } from '../metrics/metrics.service';
import { QueryAiDto } from './dto/query-ai.dto';
import { aiQueryResponseSchema } from './ai.schema';
import type { AiIntent, AnalyticsContext } from './ai.types';
import type { AiQueryResponse } from './ai.types';
import { classifyAiIntent } from './intent';
import { AI_SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { buildLocalAiResponse } from './aiResponse';

@Injectable()
export class AiService {
  private readonly client: Anthropic | null;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {
    const apiKey = this.config.get<string>('MINIMAX_API_KEY');
    this.client = apiKey
      ? new Anthropic({
          apiKey,
          baseURL: this.config.get<string>('MINIMAX_BASE_URL') ?? 'https://api.minimax.io/anthropic',
        })
      : null;
  }

  async query(dto: QueryAiDto): Promise<AiQueryResponse> {
    const intent = classifyAiIntent(dto.question);
    const range = normalizeDateRange(dto.from, dto.to);
    const context = await this.buildContext(intent, range, dto.question);

    if (!this.client) {
      return buildLocalAiResponse(dto.question, context);
    }

    try {
      const model = this.config.get<string>('MINIMAX_MODEL') ?? 'MiniMax-Text-01';
      const timeout = Number(this.config.get<string>('AI_REQUEST_TIMEOUT_MS') ?? 30000);

      const response = await this.client.messages.create({
        model,
        max_tokens: 2048,
        system: AI_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(dto.question, context) }],
      }, { timeout });

      const textBlock = response.content.find((block) => block.type === 'text');
      const raw = textBlock && textBlock.type === 'text' ? textBlock.text : null;
      if (!raw) {
        this.logger.warn('Anthropic response had no text block, falling back to local response');
        return buildLocalAiResponse(dto.question, context);
      }

      const parsed = parseJsonFromText(raw);
      if (!parsed) {
        this.logger.warn(`Anthropic response was not valid JSON, falling back. Raw: ${raw.slice(0, 200)}`);
        return buildLocalAiResponse(dto.question, context);
      }

      return aiQueryResponseSchema.parse(parsed);
    } catch (err) {
      this.logger.error(`Anthropic call failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return buildLocalAiResponse(dto.question, context);
    }
  }

  async debugConnection() {
    const apiKey = this.config.get<string>('MINIMAX_API_KEY');
    const baseURL = this.config.get<string>('MINIMAX_BASE_URL') ?? 'https://api.minimax.io/anthropic';
    const model = this.config.get<string>('MINIMAX_MODEL') ?? 'MiniMax-Text-01';
    const apiKeyMasked = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NOT_SET';

    if (!this.client) {
      return {
        configured: false,
        apiKey: apiKeyMasked,
        baseURL,
        model,
        error: 'MINIMAX_API_KEY is not set in .env',
      };
    }

    try {
      const timeout = Number(this.config.get<string>('AI_REQUEST_TIMEOUT_MS') ?? 30000);
      const response = await this.client.messages.create({
        model,
        max_tokens: 64,
        system: 'You are a friendly assistant. Reply briefly in 1-2 sentences.',
        messages: [{ role: 'user', content: 'Xin chào' }],
      }, { timeout });

      const textBlock = response.content.find((block) => block.type === 'text');
      const raw = textBlock && textBlock.type === 'text' ? textBlock.text : null;

      return {
        configured: true,
        apiKey: apiKeyMasked,
        baseURL,
        model,
        responseId: response.id,
        stopReason: response.stop_reason,
        usage: response.usage,
        rawText: raw,
        success: !!raw,
      };
    } catch (err) {
      return {
        configured: true,
        apiKey: apiKeyMasked,
        baseURL,
        model,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        errorName: err instanceof Error ? err.name : 'UnknownError',
        status: (err as { status?: number })?.status,
      };
    }
  }

  private async buildContext(intent: AiIntent, range: { from: Date; to: Date }, question: string): Promise<AnalyticsContext> {
    const base = {
      intent,
      dateRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) },
      currency: 'CNY',
      filters: { adType: null, upstream: null, downstream: null },
      metrics: {},
      rows: [],
      notes: ['All metrics were computed by backend services.'],
    } satisfies AnalyticsContext;

    if (intent === 'top_campaigns_by_revenue') {
      const rows = await this.metrics.getTopCampaignsByRevenue(range, 5);
      return {
        ...base,
        metrics: totals(rows),
        rows: rows.map(metricRow),
        notes: [...base.notes, 'Rows are sorted by revenue descending.'],
      };
    }

    if (intent === 'highest_cpm_campaigns') {
      const rows = await this.metrics.getHighestCpmCampaigns(range, 5);
      return {
        ...base,
        metrics: totals(rows),
        rows: rows.map(metricRow),
        notes: [...base.notes, 'Rows are sorted by CPM descending.'],
      };
    }

    if (intent === 'revenue_by_ad_type') {
      const rows = await this.metrics.getRevenueByAdType(range);
      return {
        ...base,
        metrics: {
          totalRevenue: round(rows.reduce((sum, row) => sum + row.revenue, 0)),
          totalCost: round(rows.reduce((sum, row) => sum + row.cost, 0)),
          totalClicks: rows.reduce((sum, row) => sum + row.clicks, 0),
        },
        rows,
        notes: [...base.notes, 'Rows are grouped by adType and sorted by revenue descending.'],
      };
    }

    if (intent === 'revenue_comparison_period') {
      const previous = previousRange(range);
      const comparison = await this.metrics.compareRevenue(range, previous);
      return {
        ...base,
        metrics: comparison,
        rows: [
          { period: 'current', from: toDateOnly(range.from), to: toDateOnly(range.to), revenue: comparison.currentRevenue },
          { period: 'previous', from: toDateOnly(previous.from), to: toDateOnly(previous.to), revenue: comparison.previousRevenue },
        ],
        notes: [...base.notes, 'Current period is compared with the immediately preceding period of the same length.'],
      };
    }

    if (intent === 'declining_clicks_campaigns') {
      const rows = await this.metrics.getDecliningClicksCampaigns(range);
      return {
        ...base,
        metrics: { decliningCampaigns: rows.length },
        rows: rows.map((row) => ({
          campaignId: row.campaignId,
          campaignName: row.campaignName,
          adType: row.adType,
          recentClicks: row.dailyClicks.map((item) => `${item.date}: ${item.clicks}`).join(', '),
        })),
        notes: [...base.notes, 'A campaign is declining when the latest 3 daily click values are strictly decreasing.'],
      };
    }

    if (intent === 'campaign_summary') {
      const summary = await this.metrics.getCampaignSummary(range, extractCampaignNameHint(question));
      return {
        ...base,
        metrics: summary
          ? {
              revenue: summary.revenue,
              cost: summary.cost,
              clicks: summary.clicks,
              impressions: summary.impressions,
              cpm: summary.cpm,
              cpa: summary.cpa,
              cps: summary.cps,
            }
          : {},
        rows: summary ? [metricRow(summary)] : [],
        notes: [...base.notes, 'If no campaign name is detected, the highest-revenue campaign in the selected period is summarized.'],
      };
    }

    return {
      ...base,
      notes: [...base.notes, 'No analytics intent matched. The user may be asking a general question; rely on the assistant persona to respond.'],
    };
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

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousRange(range: { from: Date; to: Date }) {
  const durationMs = range.to.getTime() - range.from.getTime();
  const previousTo = new Date(range.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  previousFrom.setHours(0, 0, 0, 0);
  previousTo.setHours(23, 59, 59, 999);
  return { from: previousFrom, to: previousTo };
}

function extractCampaignNameHint(question: string) {
  const match = question.match(/campaign\s+([\w\s-]+)/i);
  return match?.[1]?.trim();
}

function metricRow(row: {
  campaignId: string;
  campaignName: string;
  adType: string;
  revenue: number;
  cost: number;
  clicks: number;
  impressions: number;
  cpm: number | null;
  cpa: number | null;
  cps: number | null;
}) {
  return {
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    adType: row.adType,
    revenue: row.revenue,
    cost: row.cost,
    clicks: row.clicks,
    impressions: row.impressions,
    cpm: row.cpm,
    cpa: row.cpa,
    cps: row.cps,
  };
}

function totals(rows: Array<{ revenue: number; cost: number; clicks: number; impressions: number }>) {
  return {
    totalRevenue: round(rows.reduce((sum, row) => sum + row.revenue, 0)),
    totalCost: round(rows.reduce((sum, row) => sum + row.cost, 0)),
    totalClicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    totalImpressions: rows.reduce((sum, row) => sum + row.impressions, 0),
  };
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

function parseJsonFromText(text: string): unknown | null {
  const trimmed = text.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
