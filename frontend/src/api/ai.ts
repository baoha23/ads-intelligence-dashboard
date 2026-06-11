export type AiResponseType = 'text' | 'table' | 'mixed' | 'clarification';

export interface AiQueryRequest {
  question: string;
  from?: string;
  to?: string;
  language?: 'vi' | 'en';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function queryAi(payload: AiQueryRequest): Promise<AiQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI query failed with status ${response.status}`);
  }

  return response.json() as Promise<AiQueryResponse>;
}
