import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAiIntent } from '../intent.ts';

test('classifyAiIntent maps top revenue questions', () => {
  assert.equal(classifyAiIntent('Top 5 campaign revenue tuần này?'), 'top_campaigns_by_revenue');
  assert.equal(classifyAiIntent('Highest revenue campaigns last week'), 'top_campaigns_by_revenue');
  assert.equal(classifyAiIntent('Campaign nào có doanh thu nhiều nhất tháng 6?'), 'top_campaigns_by_revenue');
});

test('classifyAiIntent maps CPM questions', () => {
  assert.equal(classifyAiIntent('Campaign nào có CPM cao nhất tháng 6?'), 'highest_cpm_campaigns');
  assert.equal(classifyAiIntent('Top CPM this month'), 'highest_cpm_campaigns');
});

test('classifyAiIntent maps comparison questions', () => {
  assert.equal(classifyAiIntent('So sánh revenue tháng 5 vs tháng 4'), 'revenue_comparison_period');
  assert.equal(classifyAiIntent('Compare revenue this month vs last month'), 'revenue_comparison_period');
});

test('classifyAiIntent maps declining clicks questions', () => {
  assert.equal(classifyAiIntent('Campaign nào đang giảm clicks 3 ngày liên tiếp?'), 'declining_clicks_campaigns');
  assert.equal(classifyAiIntent('Decrease in clicks last 3 days'), 'declining_clicks_campaigns');
});

test('classifyAiIntent maps ad type questions', () => {
  assert.equal(classifyAiIntent('Tổng revenue theo adType CPM vs CPA'), 'revenue_by_ad_type');
  assert.equal(classifyAiIntent('Doanh thu CPM và CPA tháng này'), 'revenue_by_ad_type');
});

test('classifyAiIntent maps campaign summary', () => {
  assert.equal(classifyAiIntent('Tóm tắt campaign A trong 7 ngày gần nhất'), 'campaign_summary');
  assert.equal(classifyAiIntent('Summarize Campaign A last week'), 'campaign_summary');
});

test('classifyAiIntent returns unknown for unsupported questions', () => {
  assert.equal(classifyAiIntent('Hello there'), 'unknown');
  assert.equal(classifyAiIntent('Why is the sky blue?'), 'unknown');
});
