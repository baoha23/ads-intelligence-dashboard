export interface SampleDataOptions {
  campaigns?: number;
  days?: number;
  injectAnomaly?: boolean;
  startFresh?: boolean;
}

export interface SampleDataResult {
  campaignsCreated: number;
  recordsCreated: number;
  anomaliesInjected: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function generateSampleData(options: SampleDataOptions = {}): Promise<SampleDataResult> {
  const response = await fetch(`${API_BASE_URL}/seed/sample`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`Sample data generation failed with status ${response.status}`);
  }

  return response.json() as Promise<SampleDataResult>;
}
