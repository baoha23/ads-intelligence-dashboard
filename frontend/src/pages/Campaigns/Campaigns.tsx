import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Layers3, Plus, Trash2 } from 'lucide-react';
import { deleteCampaign, getCampaignDetail, listCampaigns } from '../../api/campaigns';
import type { CampaignDetail, CampaignListItem } from '../../api/campaigns';
import { generateSampleData } from '../../api/seed';
import type { SampleDataResult } from '../../api/seed';

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [selected, setSelected] = useState<CampaignDetail | null>(null);
  const [adType, setAdType] = useState('');
  const [upstream, setUpstream] = useState('');
  const [downstream, setDownstream] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSeed, setLastSeed] = useState<SampleDataResult | null>(null);
  const [showSeedPanel, setShowSeedPanel] = useState(false);
  const [seedCampaigns, setSeedCampaigns] = useState(3);
  const [seedDays, setSeedDays] = useState(14);
  const [seedAnomaly, setSeedAnomaly] = useState(true);
  const [seedFresh, setSeedFresh] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CampaignListItem | null>(null);
  const [lastDelete, setLastDelete] = useState<{ name: string; recordsDeleted: number } | null>(null);

  const filterOptions = useMemo(() => {
    return {
      adTypes: unique(campaigns.map((campaign) => campaign.adType)),
      upstreams: unique(campaigns.map((campaign) => campaign.upstream)),
      downstreams: unique(campaigns.map((campaign) => campaign.downstream)),
    };
  }, [campaigns]);

  useEffect(() => {
    void loadCampaigns();
  }, []);

  async function loadCampaigns(filters?: { adType?: string; upstream?: string; downstream?: string }) {
    setLoading(true);
    setError(null);
    try {
      const rows = await listCampaigns(filters);
      setCampaigns(rows);
      if (rows.length > 0) await loadDetail(rows[0].id);
      else setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await getCampaignDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void loadCampaigns({ adType: adType || undefined, upstream: upstream || undefined, downstream: downstream || undefined });
  }

  async function handleGenerate() {
    setSeeding(true);
    setError(null);
    try {
      const result = await generateSampleData({
        campaigns: seedCampaigns,
        days: seedDays,
        injectAnomaly: seedAnomaly,
        startFresh: seedFresh,
      });
      setLastSeed(result);
      setShowSeedPanel(false);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSeeding(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setDeletingId(target.id);
    setError(null);
    try {
      const result = await deleteCampaign(target.id);
      setLastDelete({ name: result.campaignName, recordsDeleted: result.recordsDeleted });
      setConfirmDelete(null);
      if (selected?.id === target.id) setSelected(null);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="dashboard-page">
      <section className="panel hero-panel">
        <div className="hero-title">
          <div className="hero-icon">
            <Layers3 size={28} />
          </div>
          <div>
            <p className="eyebrow">Campaigns</p>
            <h1>Campaign Drilldown</h1>
          </div>
        </div>

        <form className="campaign-filter" onSubmit={handleSubmit}>
          <SelectField label="Ad Type" value={adType} values={filterOptions.adTypes} onChange={setAdType} />
          <SelectField label="Upstream" value={upstream} values={filterOptions.upstreams} onChange={setUpstream} />
          <SelectField label="Downstream" value={downstream} values={filterOptions.downstreams} onChange={setDownstream} />
          <div className="button-row">
            <button className="primary-button" disabled={loading} type="submit">
              Apply filters
            </button>
            <button className="secondary-button" type="button" onClick={() => setShowSeedPanel((current) => !current)}>
              <Plus size={16} /> Add sample data
            </button>
          </div>
        </form>
      </section>

      {showSeedPanel && (
        <section className="panel result-panel">
          <div className="section-heading">
            <div>
              <span className="type-pill">Generate</span>
              <h2>Sample data</h2>
            </div>
          </div>
          <p className="summary">Backend will create random campaigns and daily records. Use this to populate the dashboard quickly.</p>
          <div className="seed-form">
            <NumberField label="Campaigns" value={seedCampaigns} min={1} max={20} onChange={setSeedCampaigns} />
            <NumberField label="Days" value={seedDays} min={1} max={60} onChange={setSeedDays} />
            <ToggleField label="Inject anomalies" value={seedAnomaly} onChange={setSeedAnomaly} />
            <ToggleField label="Wipe existing data first" value={seedFresh} onChange={setSeedFresh} />
            <button className="primary-button" disabled={seeding} type="button" onClick={() => void handleGenerate()}>
              {seeding ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </section>
      )}

      {lastSeed && (
        <div className="seed-summary">
          Generated {lastSeed.campaignsCreated} campaigns, {lastSeed.recordsCreated} daily records
          {lastSeed.anomaliesInjected > 0 ? `, ${lastSeed.anomaliesInjected} anomalies injected` : ''}.
        </div>
      )}

      {lastDelete && (
        <div className="seed-summary">
          Deleted <strong>{lastDelete.name}</strong> ({lastDelete.recordsDeleted} records removed).
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete campaign?</h3>
            <p>
              This will permanently remove <strong>{confirmDelete.name}</strong> and its {confirmDelete._count.records} daily records.
            </p>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={deletingId === confirmDelete.id}
                type="button"
                onClick={() => void handleConfirmDelete()}
              >
                {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <section className="campaign-layout">
        <div className="panel result-panel">
          <span className="type-pill">{campaigns.length} campaigns</span>
          <h2>Campaign list</h2>
          {loading ? (
            <p className="summary">Loading campaigns...</p>
          ) : (
            <div className="campaign-list">
              {campaigns.map((campaign) => (
                <div
                  className={selected?.id === campaign.id ? 'campaign-row active' : 'campaign-row'}
                  key={campaign.id}
                >
                  <button
                    className="campaign-row-button"
                    type="button"
                    onClick={() => void loadDetail(campaign.id)}
                  >
                    <strong>{campaign.name}</strong>
                    <span>{campaign.adType} · {campaign._count.records} records</span>
                  </button>
                  <button
                    aria-label={`Delete ${campaign.name}`}
                    className="row-delete-button"
                    disabled={deletingId === campaign.id}
                    type="button"
                    onClick={() => setConfirmDelete(campaign)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel result-panel">
          {detailLoading && <p className="summary">Loading records...</p>}
          {!detailLoading && selected && <CampaignDetailPanel campaign={selected} />}
          {!detailLoading && !selected && <p className="summary">Select a campaign to view records.</p>}
        </div>
      </section>
    </main>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))}
      />
    </label>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-field">
      <input checked={value} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function CampaignDetailPanel({ campaign }: { campaign: CampaignDetail }) {
  const totals = campaign.records.reduce(
    (acc, record) => {
      acc.revenue += Number(record.revenue);
      acc.cost += Number(record.cost);
      acc.clicks += record.clicks;
      acc.impressions += record.impressions;
      return acc;
    },
    { revenue: 0, cost: 0, clicks: 0, impressions: 0 },
  );

  return (
    <>
      <span className="type-pill">{campaign.adType}</span>
      <h2>{campaign.name}</h2>
      <p className="summary">
        {campaign.upstream} → {campaign.downstream}
      </p>

      <section className="mini-kpi-grid">
        <MiniKpi label="Revenue" value={formatMoney(totals.revenue)} />
        <MiniKpi label="Cost" value={formatMoney(totals.cost)} />
        <MiniKpi label="Clicks" value={formatNumber(totals.clicks)} />
        <MiniKpi label="Impressions" value={formatNumber(totals.impressions)} />
      </section>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Clicks</th>
                <th>Impressions</th>
              </tr>
            </thead>
            <tbody>
              {campaign.records.map((record) => (
                <tr key={record.id}>
                  <td>{record.date.slice(0, 10)}</td>
                  <td>{formatMoney(Number(record.revenue))}</td>
                  <td>{formatMoney(Number(record.cost))}</td>
                  <td>{formatNumber(record.clicks)}</td>
                  <td>{formatNumber(record.impressions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="mini-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function unique(values: string[]) {
  return [...new Set(values)].filter(Boolean).sort();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CNY' }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}
