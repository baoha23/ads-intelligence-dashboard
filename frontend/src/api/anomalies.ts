export interface Anomaly {
  campaignId: string;
  campaignName: string;
  date: string;
  metric: 'revenue' | 'clicks' | 'cpm';
  expected: number;
  actual: number;
  sigma: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function listAnomalies(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const query = search.toString();

  const response = await fetch(`${API_BASE_URL}/ai/anomalies${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(`Anomaly request failed with status ${response.status}`);
  }

  return response.json() as Promise<Anomaly[]>;
}
