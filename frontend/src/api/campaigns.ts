export interface CampaignListItem {
  id: string;
  name: string;
  adType: string;
  upstream: string;
  downstream: string;
  createdAt: string;
  _count: { records: number };
}

export interface DailyRecord {
  id: string;
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  revenue: string;
  cost: string;
  cpm: string | null;
  cpa: string | null;
  cps: string | null;
}

export interface CampaignDetail extends Omit<CampaignListItem, '_count'> {
  records: DailyRecord[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function listCampaigns(filters?: { adType?: string; upstream?: string; downstream?: string }) {
  const search = new URLSearchParams();
  if (filters?.adType) search.set('adType', filters.adType);
  if (filters?.upstream) search.set('upstream', filters.upstream);
  if (filters?.downstream) search.set('downstream', filters.downstream);

  const query = search.toString();
  const response = await fetch(`${API_BASE_URL}/campaigns${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(`Campaign list failed with status ${response.status}`);
  }

  return response.json() as Promise<CampaignListItem[]>;
}

export async function getCampaignDetail(id: string, params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);

  const query = search.toString();
  const response = await fetch(`${API_BASE_URL}/campaigns/${id}${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(`Campaign detail failed with status ${response.status}`);
  }

  return response.json() as Promise<CampaignDetail>;
}

export interface DeleteCampaignResult {
  deleted: true;
  campaignId: string;
  campaignName: string;
  recordsDeleted: number;
}

export async function deleteCampaign(id: string): Promise<DeleteCampaignResult> {
  const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Delete campaign failed with status ${response.status}`);
  }

  return response.json() as Promise<DeleteCampaignResult>;
}
