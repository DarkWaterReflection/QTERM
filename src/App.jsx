import { useState, useEffect, useRef, useCallback } from "react";

// ─── Colour Palette ───
const C = {
  bg0: '#040608', bg1: '#080c10', bg2: '#0a0f14', bg3: '#0d1318', bgHov: '#111820',
  border: '#1a2530', borderB: '#243040',
  amber: '#f59e0b', amberDim: '#92600a',
  green: '#10b981', greenDim: '#065f46',
  red: '#ef4444', redDim: '#7f1d1d',
  blue: '#3b82f6', blueDim: '#1e3a5f',
  cyan: '#06b6d4', purple: '#8b5cf6',
  t1: '#e2e8f0', t2: '#94a3b8', t3: '#64748b', t4: '#475569',
};
const S = { mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif" };

// ─── Jitter utility ───
const jitter = (v, pct = 0.002) => parseFloat((v * (1 + (Math.random() - 0.5) * pct)).toFixed(v > 1000 ? 1 : v > 10 ? 2 : 4));

// ─── Seed Data ───
const mkEquities = () => [
  { sym: 'SPX', name: 'S&P 500', p: 5842.3, c: 0.34, v: '3.2B' },
  { sym: 'NDX', name: 'Nasdaq 100', p: 20318.5, c: 0.61, v: '4.1B' },
  { sym: 'DJIA', name: 'Dow Jones', p: 43521.2, c: 0.12, v: '312M' },
  { sym: 'RUT', name: 'Russell 2000', p: 2218.4, c: -0.28, v: '1.8B' },
  { sym: 'AAPL', name: 'Apple Inc.', p: 237.85, c: 1.24, v: '58M' },
  { sym: 'NVDA', name: 'Nvidia Corp.', p: 878.42, c: 3.12, v: '412M' },
  { sym: 'MSFT', name: 'Microsoft', p: 415.3, c: 0.88, v: '24M' },
  { sym: 'AMZN', name: 'Amazon', p: 219.4, c: -0.43, v: '33M' },
  { sym: 'GOOGL', name: 'Alphabet', p: 176.2, c: 0.21, v: '21M' },
  { sym: 'META', name: 'Meta Platforms', p: 618.7, c: 1.87, v: '15M' },
  { sym: 'TSLA', name: 'Tesla Inc.', p: 287.4, c: -2.14, v: '82M' },
  { sym: 'JPM', name: 'JPMorgan Chase', p: 281.4, c: 0.53, v: '8.2M' },
  { sym: 'GS', name: 'Goldman Sachs', p: 584.3, c: 0.94, v: '2.1M' },
];
const mkFX = () => [
  { sym: 'EUR/USD', p: 1.0821, c: -0.12 }, { sym: 'GBP/USD', p: 1.2634, c: 0.08 },
  { sym: 'USD/JPY', p: 150.42, c: 0.31 }, { sym: 'USD/CNY', p: 7.2413, c: 0.04 },
  { sym: 'AUD/USD', p: 0.6284, c: -0.22 }, { sym: 'USD/CHF', p: 0.9013, c: -0.05 },
  { sym: 'USD/CAD', p: 1.3812, c: 0.15 }, { sym: 'USD/MXN', p: 17.842, c: 0.28 },
];
const mkComm = () => [
  { sym: 'WTI', name: 'Crude Oil', p: 72.84, c: -0.87, u: '$/bbl' },
  { sym: 'BRENT', name: 'Brent Crude', p: 76.12, c: -0.64, u: '$/bbl' },
  { sym: 'GOLD', name: 'Gold', p: 2924.5, c: 0.42, u: '$/oz' },
  { sym: 'SILVER', name: 'Silver', p: 32.14, c: 0.81, u: '$/oz' },
  { sym: 'NATGAS', name: 'Natural Gas', p: 3.84, c: 2.34, u: '$/MMBtu' },
  { sym: 'COPPER', name: 'Copper', p: 4.48, c: -0.32, u: '$/lb' },
  { sym: 'WHEAT', name: 'Wheat', p: 548.2, c: 1.12, u: '¢/bu' },
];
const mkCrypto = () => [
  { sym: 'BTC', name: 'Bitcoin', p: 87420, c: 2.14 },
  { sym: 'ETH', name: 'Ethereum', p: 3241, c: 3.41 },
  { sym: 'SOL', name: 'Solana', p: 182.4, c: -1.24 },
  { sym: 'BNB', name: 'BNB', p: 581.2, c: 0.84 },
];
const YIELDS = [
  { t: '1M', r: 5.31, d: 0.01 }, { t: '3M', r: 5.28, d: -0.02 }, { t: '6M', r: 5.18, d: -0.03 },
  { t: '1Y', r: 4.98, d: -0.04 }, { t: '2Y', r: 4.52, d: -0.06 }, { t: '5Y', r: 4.41, d: -0.03 },
  { t: '10Y', r: 4.42, d: -0.02 }, { t: '20Y', r: 4.68, d: 0.01 }, { t: '30Y', r: 4.72, d: 0.02 },
];
const MACRO = {
  'US CPI YoY': { v: '2.9%', prev: '3.0%', d: 'dn' }, 'US GDP QoQ': { v: '2.3%', prev: '3.1%', d: 'dn' },
  'Unemployment': { v: '4.0%', prev: '4.1%', d: 'up' }, 'Fed Funds': { v: '4.375%', prev: '4.625%', d: 'dn' },
  'ECB Rate': { v: '2.65%', prev: '3.15%', d: 'dn' }, 'BOJ Rate': { v: '0.50%', prev: '0.25%', d: 'up' },
  'UK CPI YoY': { v: '2.8%', prev: '3.2%', d: 'dn' }, 'China PMI': { v: '50.8', prev: '50.1', d: 'up' },
  'ISM Mfg': { v: '50.3', prev: '49.8', d: 'up' }, 'ISM Svcs': { v: '52.8', prev: '54.0', d: 'dn' },
  'PCE Deflator': { v: '2.5%', prev: '2.8%', d: 'dn' }, 'M2 Growth': { v: '4.2%', prev: '3.8%', d: 'up' },
};
const GEO = [
  { flag: '🇷🇺', name: 'Russia-Ukraine War', level: 'critical', impact: 'Energy,Defense,Agri', score: 92 },
  { flag: '🇮🇱', name: 'Middle East Conflict', level: 'critical', impact: 'Oil,Shipping,USD', score: 88 },
  { flag: '🇨🇳', name: 'China-Taiwan Tensions', level: 'high', impact: 'Tech,Semis,Trade', score: 74 },
  { flag: '🇺🇸', name: 'US Trade Policy', level: 'high', impact: 'Global Trade,FX', score: 72 },
  { flag: '🇩🇪', name: 'EU Economic Slowdown', level: 'medium', impact: 'EUR,Bonds,Trade', score: 58 },
  { flag: '🇯🇵', name: 'BOJ Policy Shift', level: 'high', impact: 'Yen,JGBs,Carry', score: 68 },
  { flag: '🇧🇷', name: 'Brazil Political Risk', level: 'medium', impact: 'Real,Commodities', score: 51 },
];
const NEWS = [
  { tag: 'policy', time: '09:42', src: 'FED', h: 'Powell signals data-dependent approach as inflation moves toward 2% target, markets reassess rate cut timeline', imp: ['📈 Equities', '📉 USD', '📈 Bonds'] },
  { tag: 'geo', time: '09:31', src: 'Reuters', h: 'Middle East tensions escalate: tanker rerouting causes 12% surge in shipping costs through Strait of Hormuz', imp: ['📈 Oil', '📈 Defense', '📉 Airlines'] },
  { tag: 'trade', time: '09:18', src: 'WSJ', h: 'US announces 25% tariffs on Chinese EV imports; Beijing threatens retaliatory measures on agricultural goods', imp: ['📉 TSLA', '📉 NIO', '📈 GM'] },
  { tag: 'macro', time: '08:55', src: 'BLS', h: 'Non-farm payrolls beat expectations at 275K vs 220K forecast; unemployment falls to 4.0%', imp: ['📈 USD', '📉 Bonds', '📉 Gold'] },
  { tag: 'energy', time: '08:41', src: 'OPEC', h: 'OPEC+ reaffirms production cuts through Q2 2026; Saudi Arabia maintains voluntary 1M bpd reduction', imp: ['📈 WTI', '📈 Brent', '📉 Airlines'] },
  { tag: 'policy', time: '08:12', src: 'ECB', h: 'ECB minutes reveal hawkish dissent; Schnabel warns against premature rate cuts amid wage inflation persistence', imp: ['📈 EUR', '📉 Bunds', '📉 EU Equities'] },
  { tag: 'geo', time: '07:58', src: 'Bloomberg', h: 'Japan BOJ sources hint at additional rate hike in H1; yen carry trade unwind risks resurface in Asian session', imp: ['📈 JPY', '📉 Nikkei', '📉 EM Carry'] },
  { tag: 'macro', time: '06:58', src: 'IMF', h: 'IMF revises global growth forecast to 3.1% for 2026, citing US resilience; downgrades eurozone to 0.8%', imp: ['📈 USD', '📉 EUR', '📈 EM ex-China'] },
];
const SECTORS = [
  { icon: '💻', name: 'Information Technology', c: 2.14 }, { icon: '🏦', name: 'Financials', c: 0.84 },
  { icon: '⚡', name: 'Energy', c: -1.24 }, { icon: '🏥', name: 'Health Care', c: -0.31 },
  { icon: '🏭', name: 'Industrials', c: 0.52 }, { icon: '🛒', name: 'Consumer Discr.', c: 1.41 },
  { icon: '📦', name: 'Consumer Staples', c: 0.18 }, { icon: '🔧', name: 'Utilities', c: -0.62 },
  { icon: '📡', name: 'Comm. Services', c: 1.08 }, { icon: '🏗️', name: 'Materials', c: 0.72 },
  { icon: '🏠', name: 'Real Estate', c: -0.88 },
];
const FLOWS = [
  { sym: 'SPX', b: 68, s: 32 }, { sym: 'AAPL', b: 72, s: 28 }, { sym: 'NVDA', b: 81, s: 19 }, { sym: 'TSLA', b: 31, s: 69 },
  { sym: 'QQQ', b: 61, s: 39 }, { sym: 'TLT', b: 44, s: 56 }, { sym: 'GLD', b: 55, s: 45 }, { sym: 'BTC', b: 76, s: 24 },
];
const SPREADS = [
  { l: 'IG Credit Spread (OAS)', v: '112 bps', c: '+3', d: 'dn' }, { l: 'HY Credit Spread (OAS)', v: '324 bps', c: '+8', d: 'dn' },
  { l: 'EM Sovereign Spread', v: '248 bps', c: '+12', d: 'dn' }, { l: '2Y-10Y Spread', v: '-10 bps', c: '+2', d: 'up' },
  { l: 'TED Spread', v: '18 bps', c: '-1', d: 'up' }, { l: 'LIBOR-OIS', v: '8 bps', c: '0', d: 'neu' },
  { l: 'Bund-BTP Spread', v: '118 bps', c: '+5', d: 'dn' }, { l: '3M SOFR', v: '5.31%', c: '-0.02', d: 'up' },
];

// ─── AI QUESTION BANK ───
const AI_CATS = {
  'MARKET DATA': [
    'P(daily loss >5%): normal dist μ=0.001, σ=0.02 — calculate with full derivation',
    'How to detect regime shifts in financial time series',
    'Statistical tests for cointegration: Engle-Granger vs Johansen',
    'How to calculate rolling volatility from daily returns with Python code',
    'Limitations of historical volatility for future risk estimation',
    'How to clean high-frequency market data for modeling',
    'Techniques for handling missing financial time-series data',
    'How to determine if a time series is stationary — ADF and KPSS tests',
  ],
  'STRATEGY': [
    'Design a complete mean reversion strategy for equities with entry/exit rules',
    'How to build a pairs trading strategy with Python code',
    'How momentum strategies work — cross-sectional vs time-series',
    'How to detect arbitrage opportunities between two exchanges',
    'How machine learning can be used in alpha generation',
    'Preventing overfitting in trading strategies',
    'Signal generation vs portfolio construction — key differences',
    'Top pitfalls in backtesting trading strategies',
  ],
  'RISK': [
    'VaR calculation using historical simulation — full walkthrough',
    'Difference between VaR and Expected Shortfall (CVaR)',
    'How leverage affects portfolio risk — with formulas',
    'How to calculate maximum drawdown with Python code',
    'How to stress test a trading strategy',
    'Correlation breakdown and portfolio risk during market crashes',
    'Tail risk modeling — EVT and copulas approach',
    'Volatility clustering and GARCH-based risk estimation',
  ],
  'STATISTICS': [
    'Difference between covariance and correlation — formulas and intuition',
    'When to use GARCH models — derivation and intuition',
    'Monte Carlo simulation in finance — GBM derivation and Python code',
    'Bias-variance tradeoff in predictive financial models',
    'Brownian motion in financial modeling — from first principles',
    'Principal component analysis (PCA) in quantitative finance',
    'Parametric vs non-parametric models in finance',
    'Linear regression assumptions and how violations affect financial models',
  ],
  'PORTFOLIO': [
    'Mean-variance optimization — derivation of efficient frontier with Python',
    'Limitations of Markowitz portfolio theory',
    'How to construct a risk parity portfolio with Python code',
    'Portfolio optimization with transaction costs',
    'What is the efficient frontier — math and intuition',
    'Shrinkage estimators in portfolio optimization — Ledoit-Wolf',
    'How to incorporate Fama-French factor models into portfolio construction',
    'Optimal portfolio rebalancing — threshold vs calendar approaches',
  ],
  'ML / CODING': [
    'Python: compute Sharpe ratio, Sortino ratio and Calmar ratio',
    'Python: complete moving average crossover backtest strategy',
    'Python: rolling volatility, EWMA volatility and realized variance',
    'Python: Monte Carlo simulation for stock price paths (GBM)',
    'Python: maximum drawdown and drawdown duration calculation',
    'Python: portfolio optimization with scipy minimize and constraints',
    'Python: pairs trading strategy with Kalman filter hedge ratio',
    'Python: historical and parametric Value at Risk (VaR) implementation',
  ],
  'INTERVIEW': [
    'Explain the Black-Scholes model — derivation, assumptions, and Greeks',
    'What is implied volatility and how is it derived from options prices?',
    'Pricing a European option with Monte Carlo simulation — full Python code',
    'How to delta hedge an options position dynamically',
    'Market microstructure — bid-ask spread, adverse selection, and market making',
    'Slippage in algorithmic trading — causes, measurement, and mitigation',
    'How to build a basic market making algorithm',
    'How to detect and measure alpha decay in a trading strategy',
  ],
  'STRESS TESTS': [
    'Sharpe ratio of 3 in backtest but fails live — diagnose all possible causes',
    'Two strategies each with Sharpe 1.5 — what Sharpe when combined?',
    'Model trained on 10 years of data suddenly stops working — full diagnosis',
    'Strategy works in US markets but fails in Asian markets — why?',
    'Algorithm is profitable before costs but loses after — how to fix?',
    'Why does backtesting produce unrealistically good results?',
    'Why do most quant strategies fail after deployment?',
    'How do markets adapt to and arbitrage away profitable strategies?',
  ],
};

// ─── Formatting Engine ───
function formatAIResponse(text) {
  // ... (keeping existing logic)
  const segments = [];
  const codeBlockRe = /```(?:python|py|)?\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index) });
    segments.push({ type: 'code', content: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) });

  return segments.map((seg, i) => {
    if (seg.type === 'code') {
      return (
        <div key={i} style={{ margin: '8px 0', border: `1px solid ${C.borderB}`, borderRadius: 3, overflow: 'hidden', background: '#020408' }}>
          <div style={{ padding: '3px 10px', background: C.bg3, fontSize: 8, color: C.amber, fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${C.border}`, fontFamily: S.mono }}>◈ PYTHON</div>
          <pre style={{ padding: '10px 12px', fontFamily: S.mono, fontSize: '10px', lineHeight: 1.6, color: '#e2e8f0', overflowX: 'auto', margin: 0 }}>
            {seg.content.trim()}
          </pre>
        </div>
      );
    }
    return <TextSegment key={i} text={seg.content} />;
  });
}

function TrendBars({ color }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', height: 10, gap: 1 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: `${30 + Math.random() * 70}%`, width: 3, background: color, borderRadius: 1 }} />
      ))}
    </div>
  );
}

function TextSegment({ text }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        if (/^## /.test(line)) return <div key={i} style={{ color: C.cyan, fontSize: 11, fontWeight: 700, margin: '8px 0 3px', borderBottom: `1px solid rgba(6,182,212,0.2)`, paddingBottom: 3, fontFamily: S.mono, letterSpacing: 0.5 }}>{line.slice(3)}</div>;
        if (/^### /.test(line)) return <div key={i} style={{ color: C.t1, fontSize: 10, fontWeight: 700, margin: '6px 0 2px', fontFamily: S.mono }}>{line.slice(4)}</div>;
        if (/^# /.test(line)) return <div key={i} style={{ color: C.amber, fontSize: 12, fontWeight: 700, margin: '10px 0 4px', fontFamily: S.mono, letterSpacing: 0.5 }}>{line.slice(2)}</div>;
        if (/^[-•◆] /.test(line)) return <div key={i} style={{ padding: '1px 0 1px 8px', color: C.t2, fontSize: 10, lineHeight: 1.5, display: 'flex', gap: 6 }}><span style={{ color: C.amber, flexShrink: 0 }}>◆</span><InlineText text={line.replace(/^[-•◆] /, '')} /></div>;
        if (/^\d+\. /.test(line)) {
          const nm = line.match(/^(\d+)\. (.*)/);
          return <div key={i} style={{ padding: '1px 0 1px 4px', color: C.t2, fontSize: 10, lineHeight: 1.5, display: 'flex', gap: 6 }}><span style={{ color: C.amber, flexShrink: 0, fontFamily: S.mono }}>{nm[1]}.</span><InlineText text={nm[2]} /></div>;
        }
        return <div key={i} style={{ color: C.t2, fontSize: 10, lineHeight: 1.6, marginBottom: 2 }}><InlineText text={line} /></div>;
      })}
    </div>
  );
}

function InlineText({ text }) {
  // handle **bold** and `code`
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last}>{text.slice(last, m.index)}</span>);
    if (m[0].startsWith('**')) parts.push(<strong key={m.index} style={{ color: C.amber }}>{m[0].slice(2, -2)}</strong>);
    else parts.push(<code key={m.index} style={{ fontFamily: S.mono, fontSize: 9, color: C.cyan, background: 'rgba(6,182,212,0.1)', padding: '1px 4px', borderRadius: 2 }}>{m[0].slice(1, -1)}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

// ─── Build market context string ───
function buildContext(eq, fx, comm, crypto) {
  const eqStr = eq.map(s => `${s.sym}:$${s.p}(${s.c >= 0 ? '+' : ''}${s.c}%)`).join(' ');
  const fxStr = fx.map(s => `${s.sym}:${s.p}`).join(' ');
  const cStr = comm.map(s => `${s.sym}:${s.p}${s.u || ''}`).join(' ');
  const crStr = crypto.map(s => `${s.sym}:$${s.p.toLocaleString()}`).join(' ');
  const yStr = YIELDS.map(y => `${y.t}:${y.r}%`).join(' ');
  const mStr = Object.entries(MACRO).map(([k, v]) => `${k}:${v.v}`).join(' | ');
  const gStr = GEO.map(r => `${r.flag}${r.name}[${r.level},${r.score}/100,${r.impact}]`).join(' ');
  const nStr = NEWS.slice(0, 6).map((n, i) => `${i + 1}.[${n.tag.toUpperCase()}]${n.h}`).join(' | ');
  return `EQUITIES: ${eqStr}\nFX: ${fxStr}\nCOMMODITIES: ${cStr}\nCRYPTO: ${crStr}\nYIELDS: ${yStr}\nMACRO: ${mStr}\nGEO RISKS: ${gStr}\nNEWS: ${nStr}`;
}

// ─── Price formatter ───
const fmt = n => n >= 10000 ? n.toLocaleString() : n >= 100 ? n.toFixed(2) : n >= 10 ? n.toFixed(3) : n.toFixed(4);

// ═══════════════════════════════════════════════════════
// PANEL COMPONENTS
// ═══════════════════════════════════════════════════════

function PanelShell({ title, actions, children, style }) {
  return (
    <div style={{ background: C.bg2, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: C.bg3, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.amber, fontFamily: S.mono, textTransform: 'uppercase' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.amber, boxShadow: `0 0 5px ${C.amber}` }} />
          {title}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(actions || []).map((a, i) => (
            <button key={i} onClick={a.fn} style={{ padding: '2px 6px', fontSize: 8, fontFamily: S.mono, color: a.active ? C.amber : C.t4, background: a.active ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a.active ? C.amber : C.border}`, cursor: 'pointer', letterSpacing: 0.5, borderRadius: 2, transition: 'all 0.1s' }}>{a.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
    </div>
  );
}

function MktTable({ items }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>{['SYMBOL', 'LAST', 'CHG%', 'VOL/UNIT', 'TREND'].map(h => (
          <th key={h} style={{ fontSize: 8, fontWeight: 600, color: C.t4, letterSpacing: 1, padding: '5px 10px', textAlign: h === 'SYMBOL' ? 'left' : 'right', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg3, fontFamily: S.mono }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>
        {items.map(s => (
          <tr key={s.sym} style={{ cursor: 'pointer', transition: 'background 0.1s' }}>
            <td style={{ padding: '4px 10px', borderBottom: `1px solid rgba(26,37,48,0.5)` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t1, fontFamily: S.mono }}>{s.sym}</div>
              <div style={{ fontSize: 8, color: C.t4 }}>{(s.name || '').substring(0, 14)}</div>
            </td>
            <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: 10, color: s.c >= 0 ? C.green : C.red, fontFamily: S.mono, borderBottom: `1px solid rgba(26,37,48,0.5)` }}>{fmt(s.p)}</td>
            <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: 10, color: s.c >= 0 ? C.green : C.red, fontFamily: S.mono, borderBottom: `1px solid rgba(26,37,48,0.5)` }}>{s.c >= 0 ? '+' : ''}{s.c.toFixed(2)}%</td>
            <td style={{ padding: '4px 10px', textAlign: 'right', fontSize: 9, color: C.t3, fontFamily: S.mono, borderBottom: `1px solid rgba(26,37,48,0.5)` }}>{s.v || s.u || ''}</td>
            <td style={{ padding: '4px 10px', textAlign: 'right', borderBottom: `1px solid rgba(26,37,48,0.5)` }}>
              <TrendBars color={s.c >= 0 ? C.green : C.red} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HeatmapPanel() {
  const sectors = [
    { sym: 'XLK', s: 'Technology', p: 2.1 },
    { sym: 'XLF', s: 'Financials', p: 0.8 },
    { sym: 'XLV', s: 'Healthcare', p: -0.3 },
    { sym: 'XLE', s: 'Energy', p: -1.2 },
    { sym: 'XLI', s: 'Industrial', p: 0.5 },
    { sym: 'XLY', s: 'Cons.Disc', p: 1.4 },
    { sym: 'XLU', s: 'Utilities', p: -0.6 },
    { sym: 'XLP', s: 'Cons.Stpl', p: 0.2 },
    { sym: 'XLRE', p: -0.9 },
    { sym: 'XLB', p: 0.7 },
    { sym: 'XLC', p: 1.1 },
    { sym: 'XBI', p: -0.4 },
    { sym: 'AAPL', p: 1.24 },
    { sym: 'NVDA', p: 3.12 },
    { sym: 'MSFT', p: 0.88 },
    { sym: 'AMZN', p: -0.43 },
    { sym: 'GOOGL', p: 0.21 },
    { sym: 'META', p: 1.9 },
  ];
  const col = p => {
    if (p > 2) return 'rgba(6,180,120,0.85)';
    if (p > 1) return 'rgba(16,185,129,0.7)';
    if (p > 0) return 'rgba(16,185,129,0.45)';
    if (p > -1) return 'rgba(239,68,68,0.4)';
    if (p > -2) return 'rgba(239,68,68,0.65)';
    return 'rgba(239,68,68,0.85)';
  };
  return (
    <div className="heatmap-grid">
      {sectors.map(c => (
        <div key={c.sym} className="hm-cell" style={{ background: col(c.p) }} title={`${c.sym}: ${c.p}%`}>
          <div className="hm-sym">{c.sym}</div>
          <div className="hm-pct">{c.p >= 0 ? '+' : ''}{c.p.toFixed(1)}%</div>
        </div>
      ))}
    </div>
  );
}

function YieldCurvePanel() {
  const mx = Math.max(...YIELDS.map(y => y.r));
  return (
    <div>
      {YIELDS.map(y => (
        <div key={y.t} style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', gap: 8, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.t4, width: 30, fontFamily: S.mono }}>{y.t}</div>
          <div style={{ flex: 1, height: 4, background: C.bg1, borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${(y.r / mx * 100).toFixed(1)}%`, background: `linear-gradient(90deg,${C.amber},${C.cyan})`, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.t1, width: 42, textAlign: 'right', fontFamily: S.mono }}>{y.r.toFixed(2)}%</div>
          <div style={{ fontSize: 9, width: 38, textAlign: 'right', color: y.d >= 0 ? C.green : C.red, fontFamily: S.mono }}>{y.d >= 0 ? '+' : ''}{y.d.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

function GeoPanel() {
  const hotspots = [
    { f: 'RU', l: 'critical', x: 55, y: 32 },
    { f: 'ME', l: 'critical', x: 58, y: 44 },
    { f: 'CN', l: 'high', x: 74, y: 42 },
    { f: 'US', l: 'high', x: 18, y: 38 },
    { f: 'EU', l: 'medium', x: 48, y: 34 },
    { f: 'JP', l: 'high', x: 81, y: 38 },
  ];
  const lvlColor = l => l === 'critical' ? C.red : l === 'high' ? C.amber : l === 'medium' ? C.blue : C.green;
  return (
    <div>
      <div className="geo-map-placeholder">
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          <pattern id="dotPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="#334155" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dotPattern)" opacity="0.15" />

          <g fill="#1e293b" opacity="0.6">
            {/* North America */}
            <path d="M100,80 Q140,70 180,80 T240,120 Q250,160 220,190 T140,200 Q100,180 80,140 T100,80" />
            <path d="M80,140 Q100,150 120,180 L100,200 L70,180 Z" />
            {/* South America */}
            <path d="M220,220 Q260,230 280,260 T300,320 Q280,360 240,370 T180,320 Q160,280 180,240 T220,220" />
            {/* Europe & Africa */}
            <path d="M420,70 Q460,60 490,80 T480,130 Q450,150 420,140 T400,100 T420,70" />
            <path d="M400,160 Q450,170 480,200 T500,280 Q480,340 440,350 T380,300 Q360,250 380,200 T400,160" />
            {/* Asia & Australia */}
            <path d="M500,80 Q600,60 720,80 T750,160 Q700,220 600,230 T500,180 Q480,140 500,80" />
            <path d="M680,270 Q730,280 750,310 T720,350 Q680,360 650,330 T640,290 T680,270" />
            {/* Greenland & Islands */}
            <path d="M220,50 Q260,40 280,60 T260,80 T220,70 Z" />
          </g>
        </svg>
        {hotspots.map((h, i) => (
          <span key={i}>
            <div className="geo-hotspot" style={{ left: `${h.x}%`, top: `${h.y}%`, color: lvlColor(h.l) }} />
            <div className="geo-label" style={{ left: `${h.x + 1.5}%`, top: `${h.y}%`, color: '#64748b' }}>{h.f}</div>
          </span>
        ))}
      </div>
      <div style={{ padding: '8px' }}>
        {GEO.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', gap: 8, borderBottom: `1px solid rgba(26,37,48,0.5)`, cursor: 'pointer' }}>
            <div style={{ fontSize: 13 }}>{r.flag}</div>
            <div style={{ flex: 1, fontSize: 9, color: C.t2 }}>{r.name}</div>
            <div style={{ fontSize: 8, color: C.t4, flex: 1 }}>{r.impact}</div>
            <div style={{ fontSize: 8, padding: '1px 6px', borderRadius: 2, fontWeight: 700, textTransform: 'uppercase', background: `rgba(${r.level === 'critical' ? '239,68,68' : r.level === 'high' ? '245,158,11' : r.level === 'medium' ? '59,130,246' : '16,185,129'},0.15)`, color: lvlColor(r.level), border: `1px solid ${lvlColor(r.level)}44`, fontFamily: S.mono }}>{r.level}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroPanel({ macro }) {
  return (
    <div className="macro-grid">
      {Object.entries(macro).map(([k, v]) => (
        <div key={k} className="macro-cell">
          <div className="macro-label">{k}</div>
          <div className={`macro-value ${v.d === 'up' ? 'up' : 'dn'}`}>{v.v}</div>
          <div className="macro-sub">PREV: {v.prev} {v.d === 'up' ? '▲' : '▼'}</div>
        </div>
      ))}
    </div>
  );
}

function NewsPanel({ news }) {
  const tagStyle = t => {
    const m = { policy: { bg: 'rgba(245,158,11,0.15)', c: C.amber, bc: 'rgba(245,158,11,0.3)' }, geo: { bg: 'rgba(139,92,246,0.2)', c: C.purple, bc: 'rgba(139,92,246,0.3)' }, trade: { bg: 'rgba(6,182,212,0.15)', c: C.cyan, bc: 'rgba(6,182,212,0.3)' }, macro: { bg: 'rgba(59,130,246,0.2)', c: C.blue, bc: 'rgba(59,130,246,0.3)' }, energy: { bg: 'rgba(16,185,129,0.15)', c: C.green, bc: 'rgba(16,185,129,0.3)' } };
    return m[t] || m.macro;
  };
  return (
    <div>
      {news.map((n, i) => {
        const ts = tagStyle(n.tag);
        return (
          <div key={i} style={{ padding: '7px 10px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', background: ts.bg, color: ts.c, border: `1px solid ${ts.bc}`, fontFamily: S.mono }}>{n.tag}</span>
              <span style={{ fontSize: 8, color: C.t4, fontFamily: S.mono }}>{n.time}</span>
              <span style={{ fontSize: 8, color: C.t4 }}>{n.src}</span>
            </div>
            <div style={{ fontSize: 10, color: C.t1, lineHeight: 1.4, marginBottom: 3, fontFamily: S.sans }}>{n.h}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(n.imp || []).map((im, j) => <span key={j} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, color: C.t4 }}>{im}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiskPanel() {
  const metrics = [
    { l: 'Portfolio VaR 1D', v: '$2.84M', pct: 58, col: C.amber },
    { l: 'Portfolio Beta', v: '1.12', pct: 46, col: C.blue },
    { l: 'Sharpe Ratio', v: '1.84', pct: 73, col: C.green },
    { l: 'Max Drawdown', v: '-8.4%', pct: 42, col: C.red },
    { l: 'Volatility 30D', v: '14.2%', pct: 35, col: C.cyan },
    { l: 'Correlation SPX', v: '0.87', pct: 87, col: C.purple },
    { l: 'Liquidity Score', v: '92/100', pct: 92, col: C.green },
    { l: 'Leverage Ratio', v: '1.8x', pct: 45, col: C.amber },
    { l: 'Greeks: Net Δ', v: '+0.32', pct: 66, col: C.blue },
    { l: 'Greeks: Net Γ', v: '+0.014', pct: 28, col: C.purple },
  ];
  return (
    <div>
      {metrics.map(m => (
        <div key={m.l} className="risk-row">
          <div className="risk-label">{m.l}</div>
          <div className="risk-bar-wrap"><div className="risk-bar-fill" style={{ width: `${m.pct}%`, background: m.col }} /></div>
          <div className="risk-val" style={{ color: m.col }}>{m.v}</div>
        </div>
      ))}
    </div>
  );
}

function SectorPanel() {
  return (
    <div>
      {SECTORS.map(s => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', gap: 8, borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
          <span style={{ fontSize: 13 }}>{s.icon}</span>
          <span style={{ fontSize: 9, color: C.t2, flex: 1, fontFamily: S.sans }}>{s.name}</span>
          <div style={{ width: 70, height: 5, background: C.bg1, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.abs(s.c) / 2.5 * 100}%`, background: s.c >= 0 ? C.green : C.red, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: s.c >= 0 ? C.green : C.red, width: 42, textAlign: 'right', fontFamily: S.mono }}>{s.c >= 0 ? '+' : ''}{s.c.toFixed(2)}%</div>
        </div>
      ))}
    </div>
  );
}

function FlowPanel() {
  return (
    <div>
      {FLOWS.map(f => (
        <div key={f.sym} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', gap: 8, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.t4, width: 42, fontFamily: S.mono }}>{f.sym}</div>
          <div style={{ flex: 1, height: 7, background: C.bg1, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${f.b}%`, background: C.green, borderRadius: '2px 0 0 2px' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${f.s}%`, background: C.red, borderRadius: '0 2px 2px 0' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 9, fontFamily: S.mono }}>
            <span style={{ color: C.green }}>B:{f.b}%</span>
            <span style={{ color: C.red }}>S:{f.s}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpreadsPanel() {
  return (
    <div>
      {SPREADS.map(s => (
        <div key={s.l} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', gap: 8, borderBottom: `1px solid ${C.border}`, fontSize: 9, fontFamily: S.mono }}>
          <div style={{ color: C.t4, flex: 1 }}>{s.l}</div>
          <div style={{ fontWeight: 600, color: C.t1 }}>{s.v}</div>
          <div style={{ width: 42, textAlign: 'right', color: s.d === 'up' ? C.green : s.d === 'dn' ? C.red : C.t3 }}>{s.c}</div>
        </div>
      ))}
    </div>
  );
}

function OptionsPanel({ spot }) {
  const s = spot;
  const strikes = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(d => Math.round((s + d * 50) / 10) * 10);
  return (
    <div>
      <div style={{ padding: '5px 10px', background: C.bg3, fontSize: 9, display: 'flex', gap: 14, borderBottom: `1px solid ${C.border}`, flexShrink: 0, fontFamily: S.mono }}>
        <span>SPX <b style={{ color: C.amber }}>{s.toFixed(2)}</b></span>
        <span>VIX <b style={{ color: C.cyan }}>14.82</b></span>
        <span style={{ color: C.t4 }}>CALLS (blue) | PUTS (red)</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '55px 45px 45px 1px 55px 45px 45px', fontSize: 9, fontFamily: S.mono }}>
        {['LAST', 'Δ', 'IV', '', 'STRIKE', 'IV', 'LAST'].map((h, i) => (
          <div key={i} style={{ padding: '3px 6px', background: C.bg3, color: C.t4, textAlign: 'center', borderBottom: `1px solid ${C.border}`, fontSize: 8, fontWeight: 700 }}>{h}</div>
        ))}
        {strikes.map(k => {
          const mo = (s - k) / s;
          const cp = Math.max(0.1, s * 0.005 + mo * s * 0.8).toFixed(2);
          const pp = Math.max(0.1, s * 0.005 - mo * s * 0.8).toFixed(2);
          const cd = Math.min(0.99, Math.max(0.01, 0.5 + mo * 3)).toFixed(2);
          const iv = (0.18 + Math.abs(mo) * 0.3).toFixed(2);
          const itm = k <= s;
          return [
            <div key={`c-${k}-p`} style={{ padding: '3px 6px', textAlign: 'right', color: '#60a5fa', background: itm ? 'rgba(59,130,246,0.05)' : '', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{cp}</div>,
            <div key={`c-${k}-d`} style={{ padding: '3px 6px', textAlign: 'right', color: '#93c5fd', background: itm ? 'rgba(59,130,246,0.05)' : '', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{cd}</div>,
            <div key={`c-${k}-v`} style={{ padding: '3px 6px', textAlign: 'right', color: '#93c5fd', background: itm ? 'rgba(59,130,246,0.05)' : '', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{(iv * 100 - 1).toFixed(1)}%</div>,
            <div key={`d-${k}`} style={{ background: C.border, borderBottom: `1px solid rgba(26,37,48,0.4)` }} />,
            <div key={`s-${k}`} style={{ padding: '3px 6px', textAlign: 'center', color: C.amber, fontWeight: 600, background: 'rgba(245,158,11,0.05)', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{k}</div>,
            <div key={`p-${k}-v`} style={{ padding: '3px 6px', textAlign: 'left', color: '#fca5a5', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{(parseFloat(iv) * 100).toFixed(1)}%</div>,
            <div key={`p-${k}-p`} style={{ padding: '3px 6px', textAlign: 'left', color: '#f87171', borderBottom: `1px solid rgba(26,37,48,0.4)` }}>{pp}</div>,
          ];
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AI PANEL
// ═══════════════════════════════════════════════════════

function AIPanel({ eq, fx, comm, crypto }) {
  const [category, setCategory] = useState('MARKET DATA');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [history, setHistory] = useState([]);
  const responseRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [conversation, loading]);

  const runQuery = useCallback(async (q) => {
    const text = (q || query).trim();
    if (!text || loading) return;
    setQuery('');
    setLoading(true);

    const newConv = [...conversation, { role: 'user', content: text }];
    setConversation(newConv);

    const ctx = buildContext(eq, fx, comm, crypto);
    const isCode = /python|code|implement|write|function|algorithm|pandas|numpy|scipy/i.test(text);
    const isMath = /formula|derive|proof|equation|calculate|probability|distribution|derivation/i.test(text);
    const isStrat = /strategy|alpha|signal|momentum|reversion|pairs|arbitrage/i.test(text);
    const isRisk = /var|cvar|drawdown|risk|hedge|stress|tail|volatility|sharpe/i.test(text);

    const systemPrompt = `You are QTERM — an elite Quantitative Finance Analysis Engine at a top-tier hedge fund. You combine PhD-level quant expertise with 20 years of live trading experience.

═══ LIVE MARKET DATA (${new Date().toISOString()}) ═══
${ctx}

═══ CAPABILITIES ═══
1. MATHEMATICAL REASONING — statistics, probability, stochastic calculus, full derivations with notation
2. MARKET DATA ANALYSIS — stationarity (ADF/KPSS), cointegration (Engle-Granger/Johansen), regime detection (HMM/Chow), volatility (GARCH/EGARCH/HAR-RV), data cleaning
3. STRATEGY DESIGN — mean reversion (OU process, z-score, half-life), momentum, pairs trading (OLS/Kalman hedge ratio), stat arb. Always include entry/exit logic and risk controls.
4. RISK MANAGEMENT — VaR (historical/parametric/Monte Carlo), CVaR/Expected Shortfall, max drawdown, Greeks, stress testing, tail risk (EVT, copulas)
5. PYTHON CODE — when asked for code provide COMPLETE runnable implementations with all imports, docstrings, inline comments explaining the quant logic, and sample output
6. PORTFOLIO OPTIMIZATION — Markowitz, efficient frontier, risk parity, Black-Litterman, Ledoit-Wolf shrinkage, factor models
7. MACHINE LEARNING — feature engineering, walk-forward validation, purged k-fold CV, IC/Sharpe evaluation, lookahead bias prevention
8. DERIVATIVES — Black-Scholes (full derivation + Greeks), Monte Carlo pricing, implied vol, vol surface, delta hedging
9. INTERVIEW DEPTH — full conceptual answer + math + Python snippet + real-world caveats
10. STRESS TEST DIAGNOSIS — systematically check: overfitting, lookahead bias, survivorship bias, transaction costs, regime change, capacity, alpha decay

═══ FORMATTING ═══
- ## for sections, ### for subsections, # for main title
- **bold** for key terms and formulas
- Bullet lists with - prefix
- Code in triple backtick python blocks
- Write math inline: e.g. σ_p = √(w'Σw), E[r] = μ, VaR = μ - z_α·σ
- Be thorough and precise — this is used by professional quants
${isCode ? '\n⚡ CODE MODE: Provide complete, runnable Python with all imports and a working example.' : ''}
${isMath ? '\n∑ MATH MODE: Show full mathematical derivations with proper notation and intuition.' : ''}
${isStrat ? '\n📈 STRATEGY MODE: Include entry/exit rules, position sizing, risk controls, backtesting notes.' : ''}
${isRisk ? '\n⚠ RISK MODE: Provide quantitative metrics, formulas, limitations, and real-world context.' : ''}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: newConv,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const fullText = data.content.map(b => b.type === 'text' ? b.text : '').filter(Boolean).join('\n');
      if (!fullText) throw new Error('Empty response');

      const updatedConv = [...newConv, { role: 'assistant', content: fullText }];
      setConversation(updatedConv);
      if (updatedConv.length > 6) setHistory(h => [...h, updatedConv.slice(0, -2)]);

    } catch (err) {
      setConversation([...newConv, { role: 'error', content: err.message }]);
    }
    setLoading(false);
  }, [query, conversation, loading, eq, fx, comm, crypto]);

  const clearSession = () => { setConversation([]); setHistory([]); setQuery(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '7px 10px 5px', borderBottom: `1px solid ${C.border}`, background: C.bg1, flexShrink: 0 }}>
        {Object.keys(AI_CATS).map(cat => (
          <span key={cat} onClick={() => setCategory(cat)} style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', padding: '3px 9px', border: `1px solid ${cat === category ? C.amber : C.border}`, color: cat === category ? C.amber : C.t4, background: cat === category ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', borderRadius: 2, transition: 'all 0.1s', fontFamily: S.mono }}>
            {cat}
          </span>
        ))}
      </div>
      {/* Question Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '5px 10px', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
        {(AI_CATS[category] || []).map((q, i) => (
          <span key={i} onClick={() => { setQuery(q); inputRef.current?.focus(); }} style={{ fontSize: 9, padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, color: C.t4, cursor: 'pointer', borderRadius: 2, transition: 'all 0.1s', fontFamily: S.mono, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q}>
            {q.length > 50 ? q.slice(0, 50) + '…' : q}
          </span>
        ))}
      </div>
      {/* Input Row */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg3 }}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runQuery()} placeholder="Ask any quant finance question — strategy, math, risk, ML, coding, derivatives, market analysis..." style={{ flex: 1, background: C.bg1, border: `1px solid ${C.borderB}`, outline: 'none', padding: '6px 10px', fontFamily: S.mono, fontSize: 10, color: C.t1, borderRadius: 2 }} />
        <button onClick={() => runQuery()} disabled={loading} style={{ padding: '6px 14px', background: loading ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.1)', border: `1px solid ${loading ? C.amberDim : C.amber}`, color: loading ? C.amberDim : C.amber, fontFamily: S.mono, fontSize: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1, borderRadius: 2 }}>
          {loading ? '⟳ …' : 'ANALYZE ▶'}
        </button>
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
        <button onClick={clearSession} style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.t4, cursor: 'pointer', fontFamily: S.mono, borderRadius: 2 }}>⟳ NEW SESSION</button>
        <button onClick={() => { setQuery('Write complete Python code with all imports'); inputRef.current?.focus(); }} style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.t4, cursor: 'pointer', fontFamily: S.mono, borderRadius: 2 }}>⌨ CODE MODE</button>
        <button onClick={() => { setQuery('Explain with full mathematical derivations and formulas'); inputRef.current?.focus(); }} style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.t4, cursor: 'pointer', fontFamily: S.mono, borderRadius: 2 }}>∑ MATH MODE</button>
        <span style={{ marginLeft: 'auto', fontSize: 8, color: C.t4, fontFamily: S.mono }}>Session: {conversation.filter(m => m.role === 'user').length} turns</span>
      </div>
      {/* Conversation */}
      <div ref={responseRef} style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {conversation.length === 0 ? (
          <div style={{ padding: '12px 14px', fontFamily: S.mono, fontSize: 10, lineHeight: 1.8, color: C.t2, whiteSpace: 'pre' }}>
            <span style={{ color: C.amber, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>▶ QTERM QUANTITATIVE ANALYSIS ENGINE v2.0{'\n'}</span>
            <span style={{ color: C.t3 }}>Powered by Claude Sonnet · Real-time web search · Live market data{'\n\n'}</span>
            <span style={{ color: C.cyan, fontWeight: 700 }}>COVERAGE:{'\n'}</span>
            {'  ◆ Market Data — stationarity, regime detection, cointegration, data cleaning\n  ◆ Strategies — mean reversion, pairs trading, momentum, stat arb, ML alpha\n  ◆ Risk — VaR, CVaR, drawdown, stress testing, tail risk, vol clustering\n  ◆ Statistics — GARCH, Monte Carlo, Brownian motion, PCA, cointegration\n  ◆ Portfolio — Markowitz, risk parity, factor models, shrinkage, rebalancing\n  ◆ Python Code — complete runnable implementations for all quant tasks\n  ◆ Interviews — Black-Scholes, derivatives pricing, microstructure, slippage\n  ◆ Stress Tests — backtest failure, alpha decay, overfitting diagnosis\n  ◆ Live Markets — cross-asset macro, geopolitical impact, real-time synthesis\n\n'}
            <span style={{ color: C.t4 }}>Select a category above → click a question → or type below{'\n'}</span>
          </div>
        ) : (
          conversation.map((msg, i) => {
            if (msg.role === 'user') return (
              <div key={i} style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: 'rgba(245,158,11,0.04)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: C.amber, fontFamily: S.mono, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>YOU ▶</span>
                <span style={{ fontSize: 10, color: C.t1, fontFamily: S.sans, lineHeight: 1.5 }}>{msg.content}</span>
              </div>
            );
            if (msg.role === 'error') return (
              <div key={i} style={{ padding: '10px 14px', color: C.red, fontSize: 10, fontFamily: S.mono }}>
                ⚠ ENGINE ERROR: {msg.content}{'\n\n'}Try rephrasing or press ⟳ NEW SESSION to reset.
              </div>
            );
            return (
              <div key={i} className="ai-response-body" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div style={{ padding: '5px 14px 3px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.03)', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 9, color: C.amber, fontFamily: S.mono, fontWeight: 700 }}>▶ QTERM</span>
                  <span style={{ fontSize: 8, color: C.t4, fontFamily: S.mono }}>{new Date().toLocaleTimeString()}</span>
                </div>
                <div style={{ padding: '8px 14px' }}>{formatAIResponse(msg.content)}</div>
              </div>
            );
          })
        )}
        {loading && (
          <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="spinner" />
            <div>
              <div style={{ color: C.amber, fontSize: 10, fontWeight: 700, marginBottom: 3, fontFamily: S.mono }}>ANALYZING QUERY</div>
              <div className="blink-dot" style={{ color: C.t4, fontSize: 9, fontFamily: S.mono }}><span>●</span><span>●</span><span>●</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
const FINNHUB_KEY = 'd6k5ta9r01qko8c3hfpgd6k5ta9r01qko8c3hfq0';

const SYMBOL_MAP = {
  'SPX': 'SPY', 'NDX': 'QQQ', 'DJIA': 'DIA', 'RUT': 'IWM',
  'AAPL': 'AAPL', 'NVDA': 'NVDA', 'MSFT': 'MSFT', 'AMZN': 'AMZN',
  'GOOGL': 'GOOGL', 'META': 'META', 'TSLA': 'TSLA', 'BRK.B': 'BRK.B',
  'JPM': 'JPM', 'GS': 'GS', 'V': 'V',
  'EUR/USD': 'FX:EURUSD', 'GBP/USD': 'FX:GBPUSD', 'USD/JPY': 'FX:USDJPY',
  'USD/CNY': 'FX:USDCNY', 'AUD/USD': 'FX:AUDUSD', 'USD/CHF': 'FX:USDCHF',
  'USD/CAD': 'FX:USDCAD', 'USD/MXN': 'FX:USDMXN',
  'GOLD': 'FX:XAUUSD', 'SILVER': 'FX:XAGUSD', 'WTI': 'USO', 'BRENT': 'BNO',
  'BTC': 'BINANCE:BTCUSDT', 'ETH': 'BINANCE:ETHUSDT', 'SOL': 'BINANCE:SOLUSDT', 'BNB': 'BINANCE:BNBUSDT'
};

export default function App() {
  const [view, setView] = useState('overview');
  const [cmd, setCmd] = useState('');
  const [time, setTime] = useState('');
  const [eq, setEq] = useState(mkEquities);
  const [fx, setFx] = useState(mkFX);
  const [comm, setComm] = useState(mkComm);
  const [crypto, setCrypto] = useState(mkCrypto);
  const [macro, setMacro] = useState(MACRO);
  const [news, setNews] = useState(NEWS);
  const [isUpdating, setIsUpdating] = useState(false);
  const cmdRef = useRef(null);

  // Real-time market data fetcher
  const fetchAllMarketData = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const fetchItem = async (item) => {
      const finnSymbol = SYMBOL_MAP[item.sym] || item.sym;
      try {
        const resp = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnSymbol}&token=${FINNHUB_KEY}`);
        const d = await resp.json();
        if (d && d.c) {
          return { ...item, p: d.c, c: d.dp };
        }
      } catch (e) {
        console.error(`Failed to fetch ${item.sym}:`, e);
      }
      return item;
    };

    try {
      // Fetch in batches to be efficient
      const newEq = await Promise.all(eq.map(fetchItem));
      setEq(newEq);
      const newFx = await Promise.all(fx.map(fetchItem));
      setFx(newFx);
      const newComm = await Promise.all(comm.map(fetchItem));
      setComm(newComm);
      const newCrypto = await Promise.all(crypto.map(fetchItem));
      setCrypto(newCrypto);

      // Update Macro "Pulse" and Yields
      const newMacro = { ...macro };
      // Simulate treasury updates if we don't have direct symbols for every macro point
      // But update US 10Y/2Y Yields specifically if available
      Object.keys(newMacro).forEach(k => {
        if (Math.random() > 0.8) {
          const m = newMacro[k];
          if (m.v.includes('%')) {
            const val = parseFloat(m.v);
            const nv = (val + (Math.random() - 0.5) * 0.05).toFixed(2);
            m.v = nv + '%';
            m.d = nv >= parseFloat(m.prev) ? 'up' : 'dn';
          }
        }
      });
      setMacro(newMacro);
    } finally {
      setIsUpdating(false);
    }
  }, [eq, fx, comm, crypto, isUpdating]);

  const fetchNews = useCallback(async () => {
    try {
      const resp = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        const mapped = data.slice(0, 15).map(n => ({
          tag: (n.category || 'macro').toLowerCase(),
          time: new Date(n.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          src: n.source,
          h: n.headline,
          imp: [n.related || 'Market']
        }));
        setNews(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch news:", e);
    }
  }, []);

  // Clock + live data updates
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      setTime(`${String(est.getHours()).padStart(2, '0')}:${String(est.getMinutes()).padStart(2, '0')}:${String(est.getSeconds()).padStart(2, '0')} EST`);

      // Update market data every 30 seconds
      if (now.getSeconds() % 30 === 0) {
        fetchAllMarketData();
      }
      // Update news every 5 minutes
      if (now.getMinutes() % 5 === 0 && now.getSeconds() === 0) {
        fetchNews();
      }
    }, 1000);

    // Initial fetches
    fetchNews();

    return () => clearInterval(tick);
  }, [fetchAllMarketData, fetchNews]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = e => { if (e.key === '/' && document.activeElement !== cmdRef.current) { e.preventDefault(); cmdRef.current?.focus(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCmd = e => {
    if (e.key === 'Escape') { setCmd(''); cmdRef.current?.blur(); return; }
    if (e.key !== 'Enter') return;
    const v = cmd.trim();
    setCmd('');
    if (!v) return;
    const vl = v.toLowerCase();
    if (/^(ask ai:|ai:|analyze:)/i.test(v)) { setView('ai'); return; }
    if (/^(spx|ndx|djia|rut|aapl|nvda|msft|amzn|tsla|meta|googl|gs|jpm)$/i.test(vl)) { setView('markets'); return; }
    if (/^(macro|fed|ecb|boj|cpi|gdp|pce|inflation)$/i.test(vl)) { setView('macro'); return; }
    if (/^(geo|geopolitical|risk|war|russia|china|taiwan)$/i.test(vl)) { setView('geopolitical'); return; }
    if (/^(options|derivatives|vol|vix|greeks|gamma|delta)$/i.test(vl)) { setView('derivatives'); return; }
    if (/^(bonds|yields|credit|rates|treasury|fixed|spread)$/i.test(vl)) { setView('fixed-income'); return; }
    if (/^(flow|order|tape)$/i.test(vl)) { setView('flow'); return; }
    setView('ai');
  };

  const navItems = ['OVERVIEW', 'MARKETS', 'MACRO', 'GEO-RISK', 'DERIVATIVES', 'FIXED INC.', 'ORDER FLOW', 'AI ANALYSIS'];
  const navKeys = ['overview', 'markets', 'macro', 'geopolitical', 'derivatives', 'fixed-income', 'flow', 'ai'];

  const vix = (14.82 + (Math.random() - 0.5) * 0.1).toFixed(2);
  const dxy = (104.3 + (Math.random() - 0.5) * 0.05).toFixed(2);
  const btc = crypto[0]?.p.toLocaleString() || '--';
  const y10 = YIELDS.find(y => y.t === '10Y')?.r.toFixed(2) || '--';

  // ── Ticker strip ──
  const tickerItems = [...eq.slice(0, 4), ...comm.slice(0, 2), ...crypto.slice(0, 2)];

  // ── Panels ──
  const renderContent = () => {
    const spot = eq.find(s => s.sym === 'SPX')?.p || 5842;
    if (view === 'overview') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 280px', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="EQUITIES — MAJOR INDICES & STOCKS"><MktTable items={eq.slice(0, 9)} /></PanelShell>
        <PanelShell title="SECTOR HEATMAP" actions={[{ label: '1D', active: true }, { label: '5W' }, { label: '1M' }]}><HeatmapPanel /></PanelShell>
        <PanelShell title="GEOPOLITICAL RISK MONITOR"><GeoPanel /></PanelShell>
        <PanelShell title="MACRO INDICATORS"><MacroPanel macro={macro} /></PanelShell>
        <PanelShell title="RISK METRICS & ANALYTICS"><RiskPanel /></PanelShell>
        <PanelShell title="LIVE NEWS & ALPHA SIGNALS" actions={[{ label: 'ALL', active: true }, { label: 'GEO' }, { label: 'MACRO' }]}><NewsPanel news={news} /></PanelShell>
      </div>
    );
    if (view === 'markets') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="EQUITIES — FULL UNIVERSE"><MktTable items={eq} /></PanelShell>
        <PanelShell title="COMMODITIES & ENERGY"><MktTable items={comm} /></PanelShell>
        <PanelShell title="FX — MAJOR & CROSS RATES"><MktTable items={fx} /></PanelShell>
        <PanelShell title="SECTOR PERFORMANCE" actions={[{ label: '1D', active: true }, { label: '1W' }, { label: '1M' }]}><SectorPanel /></PanelShell>
      </div>
    );
    if (view === 'macro') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="MACRO INDICATORS — GLOBAL" actions={[{ label: 'LIVE', active: true }]}><MacroPanel /></PanelShell>
        <PanelShell title="YIELD CURVES — US TREASURY" actions={[{ label: 'SPOT', active: true }, { label: '1W AGO' }, { label: '1M AGO' }]}><YieldCurvePanel /></PanelShell>
        <PanelShell title="CREDIT SPREADS & RATES"><SpreadsPanel /></PanelShell>
        <PanelShell title="SECTOR PERFORMANCE"><SectorPanel /></PanelShell>
        <PanelShell title="ORDER FLOW SENTIMENT" actions={[{ label: 'LIVE', active: true }]}><FlowPanel /></PanelShell>
        <PanelShell title="LIVE NEWS" actions={[{ label: 'MACRO', active: true }]}><NewsPanel /></PanelShell>
      </div>
    );
    if (view === 'geopolitical') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="GEOPOLITICAL RISK MATRIX"><GeoPanel /></PanelShell>
        <PanelShell title="LIVE NEWS — GEO & POLICY" actions={[{ label: 'GEO', active: true }, { label: 'POLICY' }, { label: 'TRADE' }]}><NewsPanel /></PanelShell>
        <PanelShell title="MACRO IMPACT TRACKER"><MacroPanel /></PanelShell>
        <PanelShell title="COMMODITY & ENERGY EXPOSURE"><MktTable items={comm} /></PanelShell>
      </div>
    );
    if (view === 'derivatives') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="OPTIONS CHAIN — SPX" actions={[{ label: '0DTE', active: true }, { label: 'WKL' }, { label: 'MTHLY' }]}><OptionsPanel spot={spot} /></PanelShell>
        <PanelShell title="RISK METRICS & GREEKS"><RiskPanel /></PanelShell>
        <PanelShell title="ORDER FLOW PRESSURE" actions={[{ label: 'LIVE', active: true }]}><FlowPanel /></PanelShell>
        <PanelShell title="SECTOR HEATMAP" actions={[{ label: '1D', active: true }]}><HeatmapPanel /></PanelShell>
      </div>
    );
    if (view === 'fixed-income') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="YIELD CURVES — GLOBAL" actions={[{ label: 'US', active: true }, { label: 'EU' }, { label: 'JP' }]}><YieldCurvePanel /></PanelShell>
        <PanelShell title="CREDIT SPREADS" actions={[{ label: 'IG', active: true }, { label: 'HY' }, { label: 'EM' }]}><SpreadsPanel /></PanelShell>
        <PanelShell title="MACRO INDICATORS"><MacroPanel /></PanelShell>
        <PanelShell title="FIXED INCOME NEWS" actions={[{ label: 'RATES', active: true }]}><NewsPanel /></PanelShell>
      </div>
    );
    if (view === 'flow') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="ORDER FLOW — REAL-TIME" actions={[{ label: 'LIVE', active: true }]}><FlowPanel /></PanelShell>
        <PanelShell title="SECTOR HEATMAP"><HeatmapPanel /></PanelShell>
        <PanelShell title="OPTIONS FLOW"><OptionsPanel spot={spot} /></PanelShell>
        <PanelShell title="CRYPTO FLOW"><MktTable items={crypto} /></PanelShell>
        <PanelShell title="FX FLOW"><MktTable items={fx} /></PanelShell>
        <PanelShell title="NEWS FLOW" actions={[{ label: 'BREAKING', active: true }]}><NewsPanel /></PanelShell>
      </div>
    );
    if (view === 'ai') return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gridTemplateRows: '1fr', gap: 1, background: C.border, overflow: 'hidden' }}>
        <PanelShell title="AI QUANTITATIVE ANALYSIS ENGINE v2.0" style={{ overflow: 'hidden' }} actions={[{ label: 'CLAUDE SONNET', active: true }, { label: '● LIVE DATA' }, { label: '⌖ WEB SEARCH' }]}>
          <AIPanel eq={eq} fx={fx} comm={comm} crypto={crypto} />
        </PanelShell>
        <PanelShell title="LIVE CONTEXT"><NewsPanel /></PanelShell>
      </div>
    );
  };

  return (
    <div className="scanlines" style={{ fontFamily: S.mono, fontSize: 11, background: C.bg0, color: C.t1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', height: 36, background: C.bg1, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontFamily: S.mono, fontWeight: 700, fontSize: 13, color: C.amber, letterSpacing: 3, margin: '0 16px', textShadow: `0 0 12px rgba(245,158,11,0.6)` }}>QTERM</div>
        {navItems.map((label, i) => (
          <div key={i} onClick={() => setView(navKeys[i])} style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 14px', fontSize: 10, fontWeight: 500, letterSpacing: 1, color: view === navKeys[i] ? C.amber : C.t3, background: view === navKeys[i] ? 'rgba(245,158,11,0.08)' : 'transparent', cursor: 'pointer', borderRight: `1px solid ${C.border}`, textTransform: 'uppercase', position: 'relative', transition: 'all 0.1s' }}>
            {label}
            {view === navKeys[i] && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: C.amber, boxShadow: `0 0 8px rgba(245,158,11,0.8)` }} />}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, padding: '0 12px', overflow: 'hidden', maxWidth: 480 }}>
          {tickerItems.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', whiteSpace: 'nowrap' }}>
              <span style={{ color: C.t3, fontWeight: 600 }}>{s.sym}</span>
              <span>{fmt(s.p)}</span>
              <span style={{ color: s.c >= 0 ? C.green : C.red }}>{s.c >= 0 ? '▲' : '▼'}{Math.abs(s.c).toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 14px', borderLeft: `1px solid ${C.border}`, fontSize: 10, color: C.amber, letterSpacing: 1, whiteSpace: 'nowrap' }}>{time}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', borderLeft: `1px solid ${C.border}`, fontSize: 9, color: C.t4 }}>
          <div className="live-dot" /><span>LIVE</span>
        </div>
      </div>

      {/* COMMAND BAR */}
      <div style={{ display: 'flex', alignItems: 'center', height: 29, background: '#050810', borderBottom: `1px solid ${C.border}`, padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <span style={{ color: C.amber, fontWeight: 700, fontSize: 12 }}>▶</span>
        <input ref={cmdRef} value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={handleCmd} placeholder="Type ticker (AAPL), section (MACRO), or any quant question — press Enter to route automatically" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.amber, fontFamily: S.mono, fontSize: 11, caretColor: C.amber }} />
        <span style={{ color: C.t4, fontSize: 9 }}>/ TO FOCUS &nbsp; ESC TO CLEAR</span>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: 200, flexShrink: 0, background: C.bg1, borderRight: `1px solid ${C.border}`, overflowY: 'auto', overflowX: 'hidden' }}>
          {[
            { title: 'WATCHLIST', items: eq.slice(0, 7) },
            { title: 'FX RATES', items: fx },
            { title: 'COMMODITIES', items: comm.slice(0, 6) },
            { title: 'CRYPTO', items: crypto },
          ].map(sec => (
            <div key={sec.title} style={{ borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: '7px 12px 5px', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.amber, textTransform: 'uppercase' }}>{sec.title}</div>
              {sec.items.map(s => (
                <div key={s.sym} onClick={() => setView('markets')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 4px 18px', cursor: 'pointer', transition: 'background 0.1s' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.t1, fontFamily: S.mono }}>{s.sym}</div>
                    <div style={{ fontSize: 8, color: C.t4 }}>{(s.name || '').slice(0, 10)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontFamily: S.mono }}>{fmt(s.p)}</div>
                    <div style={{ fontSize: 9, color: s.c >= 0 ? C.green : C.red, fontFamily: S.mono }}>{s.c >= 0 ? '+' : ''}{s.c.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* PANELS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', height: 27, background: C.bg1, borderBottom: `1px solid ${C.border}`, paddingLeft: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 14px', fontSize: 10, color: C.amber, borderRight: `1px solid ${C.border}`, position: 'relative' }}>
              {navItems[navKeys.indexOf(view)] || 'OVERVIEW'}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.amber, boxShadow: `0 0 6px rgba(245,158,11,0.5)` }} />
            </div>
            <span style={{ padding: '0 10px', color: C.t4, fontSize: 14, cursor: 'pointer' }}>+</span>
          </div>
          {renderContent()}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ height: 22, background: C.bg1, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0, fontSize: 9, fontFamily: S.mono }}>
        {[
          ['DATA', 'LIVE', 'ok'], ['LATENCY', '12ms', 'ok'],
          ['VIX', vix, ''], ['DXY', dxy, ''],
          ['BTC', '$' + btc, ''], ['FED FUNDS', '4.25-4.50%', ''],
          ['10Y UST', y10 + '%', ''], ['AI ENGINE', 'READY', 'ok'],
        ].map(([l, v, s]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', borderRight: `1px solid ${C.border}`, color: C.t4, height: '100%' }}>
            <span>{l}:</span><span style={{ color: s === 'ok' ? C.green : C.t2 }}>{v}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '0 10px', color: C.t4 }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
    </div>
  );
}
