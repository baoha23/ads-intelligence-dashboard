import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMetric } from '../anomalyDetect.ts';

test('detectMetric flags revenue spike greater than 2 sigma', () => {
  const rows = [
    { date: '2026-06-01', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-02', revenue: 105, clicks: 10, cpm: 1 },
    { date: '2026-06-03', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-04', revenue: 500, clicks: 10, cpm: 1 },
  ];
  const anomalies = detectMetric('c1', 'Campaign A', rows, 'revenue');
  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].metric, 'revenue');
  assert.equal(anomalies[0].date, '2026-06-04');
  assert.ok(anomalies[0].sigma > 2);
});

test('detectMetric ignores flat series with zero stdDev', () => {
  const rows = [
    { date: '2026-06-01', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-02', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-03', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-04', revenue: 100, clicks: 10, cpm: 1 },
  ];
  const anomalies = detectMetric('c1', 'Campaign A', rows, 'revenue');
  assert.equal(anomalies.length, 0);
});

test('detectMetric does not flag small variations under 2 sigma', () => {
  const rows = [
    { date: '2026-06-01', revenue: 100, clicks: 10, cpm: 1 },
    { date: '2026-06-02', revenue: 102, clicks: 10, cpm: 1 },
    { date: '2026-06-03', revenue: 99, clicks: 10, cpm: 1 },
    { date: '2026-06-04', revenue: 101, clicks: 10, cpm: 1 },
  ];
  const anomalies = detectMetric('c1', 'Campaign A', rows, 'revenue');
  assert.equal(anomalies.length, 0);
});
