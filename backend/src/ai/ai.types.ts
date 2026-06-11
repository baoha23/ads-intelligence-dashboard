export type AiIntent =
  | 'top_campaigns_by_revenue'
  | 'highest_cpm_campaigns'
  | 'revenue_comparison_period'
  | 'declining_clicks_campaigns'
  | 'revenue_by_ad_type'
  | 'campaign_summary'
  | 'unknown';

export type AiResponseType = 'text' | 'table' | 'mixed' | 'clarification';

export interface AnalyticsContext {
  intent: AiIntent;
  dateRange: { from: string; to: string };
  currency: string;
  filters: Record<string, string | null>;
  metrics: Record<string, number | null>;
  rows: Array<Record<string, string | number | null>>;
  notes: string[];
}

export interface AiQueryResponse {
  type: AiResponseType;
  title: string;
  summary: string;
  insights: string[];
  table: {
    columns: string[];
    rows: Array<Record<string, string | number | null>>;
  } | null;
  followUpQuestions: string[];
}
