"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Bot, CircleDollarSign, Clock3, Database, Gauge, Radio, RefreshCw, Server, ShieldCheck, TriangleAlert, Zap } from "lucide-react";

type Summary = {
  requests: number; successful: number; failed: number; successRate: number;
  inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number;
  providers: number; models: number;
  events: Array<{ occurred_at: string; requested_model: string; provider: string | null; source: string; status: number; total_tokens: number | null; latency_ms: number | null; usage_status: string; success: boolean }>;
};

const demo: Summary = {
  requests: 12845, successful: 12678, failed: 167, successRate: 98.7,
  inputTokens: 5840000, outputTokens: 2580000, totalTokens: 8420000,
  estimatedCostUsd: 0, providers: 18, models: 42,
  events: [
    { occurred_at: new Date().toISOString(), requested_model: "gemini-3.8-flash", provider: "Google AI Studio", source: "codespaces", status: 200, total_tokens: 5257, latency_ms: 1240, usage_status: "verified", success: true },
    { occurred_at: new Date(Date.now()-45000).toISOString(), requested_model: "claude-sonnet", provider: "Anthropic", source: "local", status: 200, total_tokens: 2180, latency_ms: 2340, usage_status: "verified", success: true },
    { occurred_at: new Date(Date.now()-90000).toISOString(), requested_model: "nemotron-3-nano", provider: "BluesMinds", source: "codespaces", status: 429, total_tokens: null, latency_ms: 320, usage_status: "unknown", success: false }
  ]
};

const number = (n: number) => Intl.NumberFormat("id-ID", { notation: n >= 1e6 ? "compact" : "standard", maximumFractionDigits: 2 }).format(n);
const time = (s: string) => new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Activity; tone: string }) {
  return <article className="metric"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18}/></span></div><strong>{value}</strong><small>{detail}</small></article>;
}

export default function Home() {
  const [data, setData] = useState<Summary>(demo);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLive(true);
      } else setLive(false);
    } catch { setLive(false); }
    setUpdated(new Date().toLocaleTimeString("id-ID"));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={23}/></div><div><b>MAX Information</b><span>USAGE INTELLIGENCE</span></div></div>
      <div className="workspace"><span className="workspace-dot"/><div><b>Workspace utama</b><small>All router instances</small></div><span className="chevron">⌄</span></div>
      <nav><label>MONITORING</label><a className="active"><Gauge size={17}/> Overview</a><a><Radio size={17}/> Live requests</a><a><Bot size={17}/> Model intelligence</a><a><Server size={17}/> Providers</a><a><Activity size={17}/> Clients & instances</a><label>ANALYTICS</label><a><Zap size={17}/> Token analytics</a><a><CircleDollarSign size={17}/> Cost intelligence</a><a><TriangleAlert size={17}/> Error intelligence</a><label>SYSTEM</label><a><Database size={17}/> Data sources</a><a><ShieldCheck size={17}/> API & security</a></nav>
      <div className="sidebar-bottom"><div className="avatar">K</div><div><b>Admin workspace</b><small>MAX Information v1.0</small></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><span className="eyebrow">WORKSPACE / OVERVIEW</span><h1>Usage overview</h1><p>Pantau seluruh request AI dari 9Router, Codespaces, dan instalasi lokal.</p></div><div className="top-actions"><span className={live ? "status live" : "status"}><i/>{live ? "CONNECTED" : "DEMO / OFFLINE"}</span><button onClick={refresh} aria-label="Refresh"><RefreshCw size={16}/></button></div></header>
      {!live && <div className="notice"><TriangleAlert size={17}/><span><b>Mode preview.</b> Angka contoh ditampilkan. Hubungkan Supabase dan kirim telemetry dari 9Router untuk melihat data nyata.</span></div>}
      <div className="section-heading"><div><h2>Ringkasan penggunaan</h2><p>24 jam terakhir · {updated ? `Diperbarui ${updated}` : "Memuat data..."}</p></div><span className="period">24 JAM <span>⌄</span></span></div>
      <div className="metrics">
        <Metric label="Total requests" value={number(data.requests)} detail={`${number(data.successful)} berhasil · ${number(data.failed)} gagal`} icon={Activity} tone="blue"/>
        <Metric label="Total tokens" value={number(data.totalTokens)} detail={`${number(data.inputTokens)} input · ${number(data.outputTokens)} output`} icon={Zap} tone="violet"/>
        <Metric label="Success rate" value={`${data.successRate}%`} detail="HTTP request success" icon={ShieldCheck} tone="green"/>
        <Metric label="Estimated cost" value={data.estimatedCostUsd ? `$${data.estimatedCostUsd.toFixed(4)}` : "—"} detail="USD · reported / estimated" icon={CircleDollarSign} tone="orange"/>
      </div>
      <div className="grid-main">
        <article className="panel usage-panel"><div className="panel-head"><div><h3>Token consumption</h3><p>Distribusi token input dan output</p></div><span className="legend"><i className="input-dot"/> Input <i className="output-dot"/> Output</span></div><div className="chart"><div className="y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="grid-lines"><i/><i/><i/><i/><i/></div><div className="bars">{[["Sen","62","28"],["Sel","74","38"],["Rab","55","30"],["Kam","86","47"],["Jum","68","40"],["Sab","92","58"],["Min","78","43"]].map(([day,a,b])=><div className="bar-group" key={day}><div className="bar-stack"><i style={{height:`${a}%`}}/><i style={{height:`${b}%`}}/></div><small>{day}</small></div>)}</div></div></div><div className="chart-foot"><span><b>{number(data.inputTokens)}</b><small>Input tokens</small></span><span><b>{number(data.outputTokens)}</b><small>Output tokens</small></span><span><b>{number(data.providers)}</b><small>Providers</small></span><span><b>{number(data.models)}</b><small>Models</small></span></div></article>
        <article className="panel health-panel"><div className="panel-head"><div><h3>System health</h3><p>Status collector dan database</p></div><span className="health-icon"><Activity size={18}/></span></div><div className="health-row"><span>Telemetry API</span><b className={live ? "ok" : "warn"}>{live ? "Connected" : "Waiting"}</b></div><div className="health-row"><span>Database</span><b className={live ? "ok" : "warn"}>{live ? "Connected" : "Not configured"}</b></div><div className="health-row"><span>Data ingestion</span><b className={live ? "ok" : "warn"}>{live ? "Receiving" : "No live events"}</b></div><div className="health-foot"><Clock3 size={15}/> Auto refresh setiap 15 detik</div></article>
      </div>
      <article className="panel requests-panel"><div className="panel-head"><div><h3>Recent requests</h3><p>Request terbaru dari seluruh instance</p></div><button className="text-button" onClick={refresh}>Refresh data ↗</button></div><div className="table-wrap"><table><thead><tr><th>MODEL / PROVIDER</th><th>CLIENT SOURCE</th><th>TOKENS</th><th>LATENCY</th><th>STATUS</th><th>TIME</th></tr></thead><tbody>{data.events.map((event, i)=><tr key={event.occurred_at+i}><td><b>{event.requested_model}</b><small>{event.provider || "Provider unknown"}</small></td><td><span className="source-pill">{event.source}</span></td><td>{event.total_tokens == null ? "—" : number(event.total_tokens)}</td><td>{event.latency_ms == null ? "—" : `${number(event.latency_ms)} ms`}</td><td><span className={event.success ? "badge-success" : "badge-failed"}>{event.status} · {event.success ? "Success" : "Failed"}</span></td><td>{time(event.occurred_at)}</td></tr>)}</tbody></table>{data.events.length === 0 && <div className="empty">Belum ada request. Kirim event pertama dari 9Router.</div>}</div></article>
      <footer>MAX Information <span>Built for multi-instance 9Router telemetry</span><span>{loading ? "Loading…" : "Data refresh: 15s"}</span></footer>
    </section>
  </main>;
}