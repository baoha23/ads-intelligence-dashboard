export interface AnomalyRow {
  date: string;
  revenue: number;
  clicks: number;
  cpm: number;
}

export interface AnomalyDto {
  campaignId: string;
  campaignName: string;
  date: string;
  metric: 'revenue' | 'clicks' | 'cpm';
  expected: number;
  actual: number;
  sigma: number;
}

export function detectMetric(
  campaignId: string,
  campaignName: string,
  rows: AnomalyRow[],
  metric: 'revenue' | 'clicks' | 'cpm',
): AnomalyDto[] {
  const anomalies: AnomalyDto[] = [];

  for (let index = 3; index < rows.length; index += 1) {
    const baseline = rows.slice(Math.max(0, index - 7), index).map((row) => row[metric]);
    const expected = average(baseline);
    const stdDev = standardDeviation(baseline, expected);
    if (stdDev === 0) continue;

    const actual = rows[index][metric];
    const sigma = (actual - expected) / stdDev;
    if (Math.abs(sigma) > 2) {
      anomalies.push({
        campaignId,
        campaignName,
        date: rows[index].date,
        metric,
        expected: round(expected),
        actual: round(actual),
        sigma: round(sigma),
      });
    }
  }

  return anomalies;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], avg: number) {
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
