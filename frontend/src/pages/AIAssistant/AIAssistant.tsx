import { useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { queryAi } from '../../api/ai';
import type { AiQueryResponse } from '../../api/ai';

const sampleQuestions = [
  'Top 5 campaign revenue tuần này?',
  'Campaign nào có CPM cao nhất tháng 6?',
  'Tổng revenue theo adType CPM vs CPA',
  'So sánh revenue tháng 5 vs tháng 4',
  'Campaign nào đang giảm clicks 3 ngày liên tiếp?',
  'Tóm tắt campaign A trong 7 ngày gần nhất',
  'Có campaign nào bất thường hôm nay không?',
  'Tại sao doanh thu giảm?',
];

export function AIAssistant() {
  const [question, setQuestion] = useState(sampleQuestions[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [response, setResponse] = useState<AiQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await queryAi({
        question,
        from: from || undefined,
        to: to || undefined,
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <section className="panel hero-panel">
          <div className="hero-title">
            <div className="hero-icon">
              <Bot size={28} />
            </div>
            <div>
              <p className="eyebrow">AI Ads Analyst</p>
              <h1>Natural Language Query</h1>
            </div>
          </div>

          <form className="query-form" onSubmit={handleSubmit}>
            <label className="field full-width">
              <span>Question</span>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
            </label>

            <div className="date-grid">
              <label className="field">
                <span>From</span>
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </label>
              <label className="field">
                <span>To</span>
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </label>
            </div>

            <div className="sample-list">
              {sampleQuestions.map((sample) => (
                <button className="sample-button" key={sample} type="button" onClick={() => setQuestion(sample)}>
                  {sample}
                </button>
              ))}
            </div>

            <button className="primary-button" disabled={loading || question.trim().length === 0} type="submit">
              {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              Ask AI
            </button>
          </form>
        </section>

        {error && <div className="error-box">{error}</div>}

        {response && <AiResult response={response} />}
      </div>
    </main>
  );
}

function AiResult({ response }: { response: AiQueryResponse }) {
  return (
    <section className="panel result-panel">
      <div>
        <span className="type-pill">{response.type}</span>
        <h2>{response.title}</h2>
      </div>

      <p className="summary">{response.summary}</p>

      {response.insights.length > 0 && (
        <ul className="insight-list">
          {response.insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      )}

      {response.table && <ResultTable table={response.table} />}

      {response.followUpQuestions.length > 0 && (
        <div className="follow-up-box">
          <h3>Follow-up questions</h3>
          <ul>
            {response.followUpQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ResultTable({ table }: { table: NonNullable<AiQueryResponse['table']> }) {
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={index}>
                {table.columns.map((column) => (
                  <td key={column}>{row[column] ?? '--'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
