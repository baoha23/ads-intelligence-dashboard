const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export function dailyRecordsCsvUrl(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const query = search.toString();
  return `${API_BASE_URL}/export/csv${query ? `?${query}` : ''}`;
}
