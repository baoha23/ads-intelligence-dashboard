import type { AiIntent, AiQueryResponse, AnalyticsContext } from './ai.types';

export function buildLocalAiResponse(question: string, context: AnalyticsContext): AiQueryResponse {
  if (context.intent === 'unknown' || context.rows.length === 0) {
    return clarification(question, context);
  }
  return localResponse(question, context);
}

function localResponse(question: string, context: AnalyticsContext): AiQueryResponse {
  const vi = isVietnamese(question);

  return {
    type: context.rows.length > 0 ? 'table' : 'clarification',
    title: context.intent === 'unknown' ? (vi ? 'Cần thêm thông tin' : 'Need more information') : titleForIntent(context.intent, vi),
    summary:
      context.rows.length > 0
        ? vi
          ? `Tìm thấy ${context.rows.length} dòng dữ liệu từ ${context.dateRange.from} đến ${context.dateRange.to}.`
          : `Found ${context.rows.length} rows for ${context.dateRange.from} to ${context.dateRange.to}.`
        : vi
          ? `Chưa đủ dữ liệu analytics an toàn để trả lời: ${question}`
          : `I need more supported analytics data to answer: ${question}`,
    insights: context.notes,
    table: context.rows.length > 0 ? { columns: Object.keys(context.rows[0]), rows: context.rows } : null,
    followUpQuestions: [],
  };
}

function clarification(question: string, context: AnalyticsContext): AiQueryResponse {
  const vi = isVietnamese(question);

  return {
    type: 'clarification',
    title: vi ? 'Cần thêm thông tin' : 'Need more information',
    summary: vi
      ? `Tôi chưa thể trả lời an toàn từ analytics context hiện có: ${question}`
      : `I cannot answer safely from the available analytics context: ${question}`,
    insights: context.notes,
    table: null,
    followUpQuestions: vi
      ? [
          'Hỏi top campaign theo doanh thu, campaign CPM cao nhất, so sánh doanh thu, campaign giảm clicks, hoặc doanh thu theo ad type.',
        ]
      : [
          'Ask for top revenue campaigns, highest CPM campaigns, revenue comparison, declining clicks, or revenue by ad type.',
        ],
  };
}

function titleForIntent(intent: AiIntent, vi = false) {
  const titles: Record<AiIntent, string> = vi
    ? {
        top_campaigns_by_revenue: 'Top campaign theo doanh thu',
        highest_cpm_campaigns: 'Campaign có CPM cao nhất',
        revenue_comparison_period: 'So sánh doanh thu',
        declining_clicks_campaigns: 'Campaign đang giảm clicks',
        revenue_by_ad_type: 'Doanh thu theo ad type',
        campaign_summary: 'Tóm tắt campaign',
        unknown: 'Cần thêm thông tin',
      }
    : {
        top_campaigns_by_revenue: 'Top campaigns by revenue',
        highest_cpm_campaigns: 'Highest CPM campaigns',
        revenue_comparison_period: 'Revenue comparison',
        declining_clicks_campaigns: 'Declining clicks campaigns',
        revenue_by_ad_type: 'Revenue by ad type',
        campaign_summary: 'Campaign summary',
        unknown: 'Need more information',
      };
  return titles[intent];
}

function isVietnamese(question: string) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(question)
    || /\b(doanh thu|chiến dịch|tóm tắt|so sánh|cao nhất|giảm)\b/i.test(question);
}
