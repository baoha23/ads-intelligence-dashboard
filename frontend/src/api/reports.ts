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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function getWeeklyReport(weekEnd?: string): Promise<WeeklyReport> {
  const search = new URLSearchParams();
  if (weekEnd) search.set('weekEnd', weekEnd);
  const query = search.toString();

  const response = await fetch(`${API_BASE_URL}/ai/report/weekly${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(`Weekly report failed with status ${response.status}`);
  }

  return response.json() as Promise<WeeklyReport>;
}
