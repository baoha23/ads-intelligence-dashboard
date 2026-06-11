import type { AiIntent } from './ai.types';

export function classifyAiIntent(question: string): AiIntent {
  const normalized = question.toLowerCase();

  if (hasAny(normalized, ['top', 'cao nhất', 'highest', 'nhiều nhất']) && hasAny(normalized, ['revenue', 'doanh thu'])) {
    return 'top_campaigns_by_revenue';
  }

  if (hasAny(normalized, ['cpm']) && hasAny(normalized, ['cao nhất', 'highest', 'top'])) {
    return 'highest_cpm_campaigns';
  }

  if (hasAny(normalized, ['adtype', 'ad type', 'cpm vs cpa', 'cpm và cpa', 'cpa và cpm', 'cpa vs cpm']) && hasAny(normalized, ['revenue', 'doanh thu'])) {
    return 'revenue_by_ad_type';
  }

  if (hasAny(normalized, ['so sánh', 'compare', 'vs']) && hasAny(normalized, ['revenue', 'doanh thu'])) {
    return 'revenue_comparison_period';
  }

  if (hasAny(normalized, ['giảm', 'declining', 'drop', 'decrease']) && hasAny(normalized, ['click', 'clicks'])) {
    return 'declining_clicks_campaigns';
  }

  if (hasAny(normalized, ['tóm tắt', 'summary', 'summarize', 'campaign'])) {
    return 'campaign_summary';
  }

  return 'unknown';
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}
