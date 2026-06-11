import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalAiResponse } from '../aiResponse.ts';
import type { AnalyticsContext } from '../ai.types.ts';

const baseContext: AnalyticsContext = {
  intent: 'top_campaigns_by_revenue',
  dateRange: { from: '2026-06-01', to: '2026-06-07' },
  currency: 'CNY',
  filters: { adType: null, upstream: null, downstream: null },
  metrics: { totalRevenue: 1000 },
  rows: [{ campaignName: 'Campaign A', revenue: 1000 }],
  notes: ['All metrics were computed by backend services.'],
};

test('buildLocalAiResponse returns table for populated context', () => {
  const result = buildLocalAiResponse('Top 5 campaign revenue tuần này?', baseContext);
  assert.equal(result.type, 'table');
  assert.equal(result.table?.rows.length, 1);
});

test('buildLocalAiResponse returns clarification for empty rows', () => {
  const emptyContext: AnalyticsContext = { ...baseContext, rows: [], intent: 'unknown' };
  const result = buildLocalAiResponse('Hello there', emptyContext);
  assert.equal(result.type, 'clarification');
  assert.ok(result.followUpQuestions.length > 0);
});

test('buildLocalAiResponse uses Vietnamese titles for Vietnamese questions', () => {
  const result = buildLocalAiResponse('Top 5 campaign doanh thu tuần này?', baseContext);
  assert.equal(result.title, 'Top campaign theo doanh thu');
});

test('buildLocalAiResponse uses English titles for English questions', () => {
  const result = buildLocalAiResponse('Top revenue campaigns this week', baseContext);
  assert.equal(result.title, 'Top campaigns by revenue');
});
