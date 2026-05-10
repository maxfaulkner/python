import { DRIVER_COLORS } from '../constants'

function fmtLap(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toFixed(3).padStart(6, '0')}`
}

function fmtPct(v) {
  if (v == null) return '—'
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function H2HStatBlock({ drivers, fieldMedian }) {
  if (!drivers || drivers.length !== 2) return null
  const [a, b] = drivers

  const rows = [
    {
      label: 'Best Lap',
      a: fmtLap(a.stats.best_lap),
      b: fmtLap(b.stats.best_lap),
      winner: a.stats.best_lap != null && b.stats.best_lap != null
        ? (a.stats.best_lap <= b.stats.best_lap ? 'a' : 'b')
        : null,
    },
    {
      label: 'Median Pace',
      a: fmtLap(a.stats.median_lap),
      b: fmtLap(b.stats.median_lap),
      winner: a.stats.median_lap != null && b.stats.median_lap != null
        ? (a.stats.median_lap <= b.stats.median_lap ? 'a' : 'b')
        : null,
    },
    {
      label: 'vs Field',
      a: fieldMedian ? fmtPct((a.stats.median_lap - fieldMedian) / fieldMedian * 100) : '—',
      b: fieldMedian ? fmtPct((b.stats.median_lap - fieldMedian) / fieldMedian * 100) : '—',
      winner: a.stats.median_lap != null && b.stats.median_lap != null
        ? (a.stats.median_lap <= b.stats.median_lap ? 'a' : 'b')
        : null,
    },
    {
      label: 'Consistency σ',
      a: a.stats.sigma != null ? `${a.stats.sigma.toFixed(3)}s` : '—',
      b: b.stats.sigma != null ? `${b.stats.sigma.toFixed(3)}s` : '—',
      winner: (a.stats.sigma != null && b.stats.sigma != null)
        ? (a.stats.sigma <= b.stats.sigma ? 'a' : 'b')
        : null,
    },
  ]

  return (
    <div className="h2h-stat-block">
      <div className="h2h-col" style={{ '--driver-color': DRIVER_COLORS[0] }}>
        <div className="h2h-name">{a.driver_name}</div>
        {rows.map((r) => (
          <div key={r.label} className={`h2h-cell ${r.winner === 'a' ? 'winner' : ''}`}>
            {r.a}
            {r.winner === 'a' && <span className="best-badge">BEST</span>}
          </div>
        ))}
      </div>
      <div className="h2h-divider">
        <div className="h2h-vs">VS</div>
        {rows.map((r) => (
          <div key={r.label} className="h2h-row-label">{r.label}</div>
        ))}
      </div>
      <div className="h2h-col right" style={{ '--driver-color': DRIVER_COLORS[1] }}>
        <div className="h2h-name">{b.driver_name}</div>
        {rows.map((r) => (
          <div key={r.label} className={`h2h-cell ${r.winner === 'b' ? 'winner' : ''}`}>
            {r.winner === 'b' && <span className="best-badge">BEST</span>}
            {r.b}
          </div>
        ))}
      </div>
    </div>
  )
}
