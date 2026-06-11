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

export interface MetricsOverviewResponse {
  dateRange: { from: string; to: string };
  totalCampaigns: number;
  totalRevenue: number;
  totalCost: number;
  totalClicks: number;
  totalImpressions: number;
  topCampaigns: CampaignMetricRow[];
}

export interface MetricsTrendPoint {
  date: string;
  revenue: number;
  cost: number;
  clicks: number;
  impressions: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function getMetricsOverview(params?: { from?: string; to?: string }): Promise<MetricsOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/metrics/overview${toQuery(params)}`);

  if (!response.ok) {
    throw new Error(`Metrics overview failed with status ${response.status}`);
  }

  return response.json() as Promise<MetricsOverviewResponse>;
}

export async function getMetricsTrend(params?: { from?: string; to?: string }): Promise<MetricsTrendPoint[]> {
  const response = await fetch(`${API_BASE_URL}/metrics/trend${toQuery(params)}`);

  if (!response.ok) {
    throw new Error(`Metrics trend failed with status ${response.status}`);
  }

  return response.json() as Promise<MetricsTrendPoint[]>;
}

function toQuery(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const query = search.toString();
  return query ? `?${query}` : '';
}
