import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertTriangle, BarChart3, DollarSign, MousePointerClick, TrendingUp } from 'lucide-react';
import { listAnomalies } from '../../api/anomalies';
import type { Anomaly } from '../../api/anomalies';
import { dailyRecordsCsvUrl } from '../../api/exportCsv';
import { getMetricsOverview, getMetricsTrend } from '../../api/metrics';
import type { MetricsOverviewResponse, MetricsTrendPoint } from '../../api/metrics';

export function Dashboard() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<MetricsOverviewResponse | null>(null);
  const [trend, setTrend] = useState<MetricsTrendPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview(params?: { from?: string; to?: string }) {
    setLoading(true);
    setError(null);
    try {
      const [overviewResult, trendResult, anomalyResult] = await Promise.all([
        getMetricsOverview(params),
        getMetricsTrend(params),
        listAnomalies(params),
      ]);
      setData(overviewResult);
      setTrend(trendResult);
      setAnomalies(anomalyResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void loadOverview({ from: from || undefined, to: to || undefined });
  }

  function handleExport() {
    window.location.href = dailyRecordsCsvUrl({ from: from || undefined, to: to || undefined });
  }

  return (
    <main className="dashboard-page">
      <section className="panel hero-panel">
        <div className="hero-title">
          <div className="hero-icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="eyebrow">Ads Intelligence</p>
            <h1>Performance Overview</h1>
          </div>
        </div>

        <form className="dashboard-filter" onSubmit={handleSubmit}>
          <label className="field">
            <span>From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <div className="button-row">
            <button className="primary-button" disabled={loading} type="submit">
              Refresh
            </button>
            <button className="secondary-button" type="button" onClick={handleExport}>
              Download CSV
            </button>
          </div>
        </form>
      </section>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="panel muted-panel">Loading metrics...</div>}
      {data && !loading && <OverviewContent anomalies={anomalies} data={data} trend={trend} />}
    </main>
  );
}

function OverviewContent({
  anomalies,
  data,
  trend,
}: {
  anomalies: Anomaly[];
  data: MetricsOverviewResponse;
  trend: MetricsTrendPoint[];
}) {
  const profit = data.totalRevenue - data.totalCost;

  return (
    <>
      <section className="kpi-grid">
        <KpiCard icon={<DollarSign size={22} />} label="Revenue" value={formatMoney(data.totalRevenue)} />
        <KpiCard icon={<TrendingUp size={22} />} label="Profit" value={formatMoney(profit)} />
        <KpiCard icon={<MousePointerClick size={22} />} label="Clicks" value={formatNumber(data.totalClicks)} />
        <KpiCard icon={<BarChart3 size={22} />} label="Campaigns" value={formatNumber(data.totalCampaigns)} />
      </section>

      <section className="panel result-panel">
        <div className="section-heading">
          <div>
            <span className="type-pill">Daily trend</span>
            <h2>Revenue vs cost</h2>
          </div>
        </div>
        <TrendChart points={trend} />
      </section>

      <AnomalyPanel anomalies={anomalies} />

      <section className="panel result-panel">
        <div className="section-heading">
          <div>
            <span className="type-pill">{data.dateRange.from} → {data.dateRange.to}</span>
            <h2>Top campaigns by revenue</h2>
          </div>
        </div>

        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Ad Type</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Clicks</th>
                  <th>CPM</th>
                  <th>CPA</th>
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.map((row) => (
                  <tr key={row.campaignId}>
                    <td>{row.campaignName}</td>
                    <td>{row.adType}</td>
                    <td>{formatMoney(row.revenue)}</td>
                    <td>{formatMoney(row.cost)}</td>
                    <td>{formatNumber(row.clicks)}</td>
                    <td>{formatNullable(row.cpm)}</td>
                    <td>{formatNullable(row.cpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <section className="panel result-panel anomaly-panel">
      <div className="section-heading">
        <div>
          <span className="type-pill">AI signal</span>
          <h2>Anomaly detection</h2>
        </div>
        <div className="anomaly-count">
          <AlertTriangle size={18} />
          {anomalies.length}
        </div>
      </div>

      {anomalies.length === 0 ? (
        <p className="summary">No anomaly detected in the selected period.</p>
      ) : (
        <div className="anomaly-list">
          {anomalies.slice(0, 6).map((anomaly) => (
            <article className="anomaly-item" key={`${anomaly.campaignId}-${anomaly.date}-${anomaly.metric}`}>
              <strong>{anomaly.campaignName}</strong>
              <span>{anomaly.date} · {anomaly.metric} · σ {formatNumber(anomaly.sigma)}</span>
              <small>Actual {formatNumber(anomaly.actual)} vs expected {formatNumber(anomaly.expected)}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TrendChart({ points }: { points: MetricsTrendPoint[] }) {
  if (points.length === 0) return <p className="summary">No trend data for this period.</p>;

  const maxValue = Math.max(...points.flatMap((point) => [point.revenue, point.cost]), 1);
  const width = 720;
  const height = 260;
  const padding = 32;
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const toPoint = (value: number, index: number) => {
    const x = padding + index * xStep;
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  };

  const revenuePath = points.map((point, index) => toPoint(point.revenue, index)).join(' ');
  const costPath = points.map((point, index) => toPoint(point.cost, index)).join(' ');

  return (
    <div className="trend-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue and cost daily trend">
        <polyline className="trend-line revenue" points={revenuePath} />
        <polyline className="trend-line cost" points={costPath} />
        {points.map((point, index) => {
          const [x, y] = toPoint(point.revenue, index).split(',').map(Number);
          return <circle className="trend-dot revenue" cx={x} cy={y} key={`revenue-${point.date}`} r="4" />;
        })}
        {points.map((point, index) => {
          const [x, y] = toPoint(point.cost, index).split(',').map(Number);
          return <circle className="trend-dot cost" cx={x} cy={y} key={`cost-${point.date}`} r="4" />;
        })}
      </svg>
      <div className="trend-legend">
        <span><i className="legend-dot revenue" /> Revenue</span>
        <span><i className="legend-dot cost" /> Cost</span>
      </div>
      <div className="trend-labels">
        {points.map((point) => (
          <span key={point.date}>{point.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CNY' }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatNullable(value: number | null) {
  return value === null ? '--' : formatNumber(value);
}
