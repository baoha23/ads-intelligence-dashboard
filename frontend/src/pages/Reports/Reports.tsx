import { useEffect, useState } from 'react';
import { FileBarChart2 } from 'lucide-react';
import { getWeeklyReport } from '../../api/reports';
import type { WeeklyReport } from '../../api/reports';

export function Reports() {
  const [weekEnd, setWeekEnd] = useState('');
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadReport();
  }, []);

  async function loadReport(params?: { weekEnd?: string }) {
    setLoading(true);
    setError(null);
    try {
      setReport(await getWeeklyReport(params?.weekEnd));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    void loadReport({ weekEnd: weekEnd || undefined });
  }

  return (
    <main className="dashboard-page">
      <section className="panel hero-panel">
        <div className="hero-title">
          <div className="hero-icon">
            <FileBarChart2 size={28} />
          </div>
          <div>
            <p className="eyebrow">Reports</p>
            <h1>Weekly report</h1>
          </div>
        </div>

        <form className="dashboard-filter" onSubmit={(event) => { event.preventDefault(); handleRefresh(); }}>
          <label className="field">
            <span>Week end date</span>
            <input type="date" value={weekEnd} onChange={(event) => setWeekEnd(event.target.value)} />
          </label>
          <div className="button-row">
            <button className="primary-button" disabled={loading} type="submit">
              Generate
            </button>
          </div>
        </form>
      </section>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="panel muted-panel">Generating report...</div>}
      {report && !loading && <ReportContent report={report} />}
    </main>
  );
}

function ReportContent({ report }: { report: WeeklyReport }) {
  const profit = report.totals.revenue - report.totals.cost;

  return (
    <>
      <section className="kpi-grid">
        <KpiCard label="Revenue" value={formatMoney(report.totals.revenue)} />
        <KpiCard label="Profit" value={formatMoney(profit)} />
        <KpiCard label="Clicks" value={formatNumber(report.totals.clicks)} />
        <KpiCard label="Campaigns" value={formatNumber(report.totals.campaigns)} />
      </section>

      <section className="panel result-panel">
        <div className="section-heading">
          <div>
            <span className="type-pill">{report.weekRange.from} → {report.weekRange.to}</span>
            <h2>Top campaigns</h2>
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
                </tr>
              </thead>
              <tbody>
                {report.topCampaigns.map((row) => (
                  <tr key={row.campaignName}>
                    <td>{row.campaignName}</td>
                    <td>{row.adType}</td>
                    <td>{formatMoney(row.revenue)}</td>
                    <td>{formatMoney(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel result-panel">
        <div className="section-heading">
          <div>
            <span className="type-pill">Summary</span>
            <h2>Revenue by ad type</h2>
          </div>
        </div>
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ad Type</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {report.byAdType.map((row) => (
                  <tr key={row.adType}>
                    <td>{row.adType}</td>
                    <td>{formatMoney(row.revenue)}</td>
                    <td>{formatMoney(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {report.anomalies.length > 0 && (
        <section className="panel result-panel anomaly-panel">
          <div className="section-heading">
            <div>
              <span className="type-pill">Anomalies</span>
              <h2>This week signals</h2>
            </div>
            <div className="anomaly-count">{report.anomalies.length}</div>
          </div>
          <div className="anomaly-list">
            {report.anomalies.map((anomaly, index) => (
              <article className="anomaly-item" key={`${anomaly.campaignName}-${anomaly.date}-${anomaly.metric}-${index}`}>
                <strong>{anomaly.campaignName}</strong>
                <span>{anomaly.date} · {anomaly.metric} · σ {formatNumber(anomaly.sigma)}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="kpi-card">
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
