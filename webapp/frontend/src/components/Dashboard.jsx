import { useState, useEffect, useRef, useCallback } from 'react'
import Header from './Header'

/* ── Node definitions ── */
const NODES = [
  {
    id: 1, angle: -90, name: 'Pricing\nProfessor', href: 'https://pricingprofessor.mbanc.ai',
    sub: 'Par-rate & Lock Engine',
    k1: 'Quotes', v1: '2,840/day', k2: 'LOs', v2: '38', k3: 'Latency', v3: '0.4s', k4: 'Status', v4: 'Live',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    hasRateSheet: true,
  },
  {
    id: 2, angle: -30, name: 'App\nChecker', href: 'https://appchecker.mbanc.ai',
    sub: 'Loan Compliance Engine',
    k1: 'Investors', v1: 'eRESI, Verus', k2: 'Data Points', v2: '200+', k3: 'Avg Time', v3: '<3s', k4: 'Status', v4: 'Live',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: 3, angle: 30, name: 'Appraisal\nAnalyzer', soon: true,
    sub: 'Comp Grid + Review',
    k1: 'Reports', v1: 'Coming', k2: 'Accuracy', v2: '—', k3: 'Parse', v3: '—', k4: 'Status', v4: 'Soon',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 4, angle: 90, name: 'Guideline\nGuru', href: 'https://guidelines.mbanc.ai',
    sub: 'Investor Config Hub',
    k1: 'Investors', v1: '2', k2: 'Versions', v2: 'Active', k3: 'API', v3: 'REST', k4: 'Status', v4: 'Live',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  },
  {
    id: 5, angle: 150, name: 'Bank Stmt\nAnalyzer', soon: true,
    sub: 'Income Calculation',
    k1: 'Stmts', v1: 'Coming', k2: 'Saved', v2: '—', k3: 'UW Concur', v3: '—', k4: 'Status', v4: 'Soon',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: 6, angle: 210, name: 'DocList\nDoctor', soon: true,
    sub: 'Conditional Checklist',
    k1: 'Lists', v1: 'Coming', k2: 'First-pass', v2: '—', k3: 'Resubmits', v3: '—', k4: 'Status', v4: 'Soon',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  },
]

/* ── Default core state ── */
const DEFAULT_DATA = [
  { k: 'Pipeline', v: '$487', u: 'M' },
  { k: 'Active Loans', v: '—', u: '', id: 'active-loan-count' },
  { k: 'Avg Rate', v: '6.75', u: '%', cls: 'down' },
  { k: 'Pull-Thru', v: '97', u: '%', cls: 'up' },
]

/* ── Spoke endpoints (60° apart from center 350,350) ── */
const SPOKE_ANGLES = [-90, -30, 30, 90, 150, 210]
const cx = 350, cy = 350, nr = 260

function spokeEnd(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + nr * Math.cos(rad), y: cy + nr * Math.sin(rad) }
}
function spokeStart(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + 172 * Math.cos(rad), y: cy + 172 * Math.sin(rad) }
}
function dotPos(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + 152 * Math.cos(rad), y: cy + 152 * Math.sin(rad) }
}

function formatClock() {
  const d = new Date()
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${months[d.getMonth()]} ${d.getDate()} \u00B7 ${d.getFullYear()} \u00B7 ${hh}:${mm}:${ss}`
}

function formatUtc(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function Dashboard() {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [clock, setClock] = useState(formatClock())
  const [activeLoans, setActiveLoans] = useState(null)
  const [rateSheetFmt, setRateSheetFmt] = useState(null)
  const coreRef = useRef(null)

  // Clock
  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(id)
  }, [])

  // Active loan count polling
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const r = await fetch('/api/pipeline/active-count')
        if (r.ok) {
          const d = await r.json()
          if (d.count != null) setActiveLoans(d.count)
        }
      } catch (_) {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 300000)
    return () => clearInterval(id)
  }, [])

  // Rate sheet update
  useEffect(() => {
    const refresh = async () => {
      try {
        const r = await fetch('/api/rate-sheets/latest-update')
        if (r.ok) {
          const d = await r.json()
          setRateSheetFmt(formatUtc(d.latest_utc))
        }
      } catch (_) {}
    }
    setTimeout(refresh, 1000)
    const id = setInterval(refresh, 120000)
    return () => clearInterval(id)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 6) {
        const node = NODES.find(nd => nd.id === n)
        if (node && node.href) {
          window.location.href = node.href
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleNodeEnter = useCallback((node) => {
    setHoveredNode(node)
  }, [])
  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null)
  }, [])

  // Core display data
  const coreData = hoveredNode
    ? [
        { k: hoveredNode.k1, v: hoveredNode.v1, u: '' },
        { k: hoveredNode.k2, v: hoveredNode.v2, u: '' },
        { k: hoveredNode.k3, v: hoveredNode.v3, u: '' },
        { k: hoveredNode.k4, v: hoveredNode.v4, u: '' },
      ]
    : DEFAULT_DATA.map(d => d.id === 'active-loan-count'
        ? { ...d, v: activeLoans != null ? String(activeLoans) : '—' }
        : d
      )

  const coreSub = hoveredNode ? hoveredNode.sub : clock

  return (
    <>
      <Header />

      <main className="console">
        <div className="ring-container">

          {/* Rotating ring artwork */}
          <div className="ring-rings">
            <svg viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF5500" stopOpacity="0.5"/>
                  <stop offset="30%" stopColor="#FF3300" stopOpacity="0.3"/>
                  <stop offset="60%" stopColor="#FF3300" stopOpacity="0.12"/>
                  <stop offset="100%" stopColor="#FF3300" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <circle cx="350" cy="350" r="350" fill="url(#coreGlow)"/>
              <g className="rot-slow">
                <circle cx="350" cy="350" r="330" stroke="rgba(255,51,0,0.15)" strokeWidth="1" fill="none"/>
                <circle cx="350" cy="350" r="330" stroke="rgba(255,51,0,0.35)" strokeWidth="1" strokeDasharray="2 28" fill="none"/>
              </g>
              <g className="rot-mid">
                <circle cx="350" cy="350" r="290" stroke="rgba(232,236,245,0.06)" strokeWidth="1" fill="none"/>
                <circle cx="350" cy="350" r="290" stroke="rgba(255,51,0,0.25)" strokeWidth="1" strokeDasharray="1 12" fill="none"/>
              </g>
              <g className="rot-fast">
                <circle cx="350" cy="350" r="240" stroke="rgba(255,51,0,0.18)" strokeWidth="1" strokeDasharray="8 4" fill="none"/>
              </g>
              <circle cx="350" cy="350" r="152" stroke="rgba(232,236,245,0.05)" strokeWidth="1" fill="none"/>
              <g stroke="rgba(255,51,0,0.4)" strokeWidth="1.5" strokeLinecap="round">
                <line x1="350" y1="12" x2="350" y2="28"/>
                <line x1="350" y1="672" x2="350" y2="688"/>
                <line x1="12" y1="350" x2="28" y2="350"/>
                <line x1="672" y1="350" x2="688" y2="350"/>
              </g>
            </svg>
          </div>

          {/* Connector spokes */}
          <svg className="spokes" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {SPOKE_ANGLES.map((angle, i) => {
                const end = spokeEnd(angle)
                return (
                  <linearGradient key={i} id={`spoke${i+1}`} x1="350" y1="350" x2={end.x} y2={end.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF5500" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#FF5500" stopOpacity="0.05"/>
                  </linearGradient>
                )
              })}
            </defs>
            {SPOKE_ANGLES.map((angle, i) => {
              const end = spokeEnd(angle)
              return <line key={`spoke-${i}`} x1="350" y1="350" x2={end.x} y2={end.y} stroke={`url(#spoke${i+1})`} strokeWidth="0.8" strokeDasharray="4 6"/>
            })}
            {SPOKE_ANGLES.map((angle, i) => {
              const dot = dotPos(angle)
              return <circle key={`dot-${i}`} cx={dot.x} cy={dot.y} r="2" fill="#FF5500" opacity="0.4"/>
            })}
            {/* Extra inner spokes */}
            {SPOKE_ANGLES.map((angle, i) => {
              const s = spokeStart(angle)
              const e = spokeEnd(angle)
              return <line key={`inner-${i}`} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="rgba(255,51,0,0.18)" strokeWidth="1" strokeDasharray="3 4"/>
            })}
          </svg>

          {/* Core */}
          <div className="core" ref={coreRef} style={hoveredNode ? {
            borderColor: 'rgba(255, 51, 0, 0.5)',
            boxShadow: '0 0 120px rgba(255, 51, 0, 0.2), inset 0 0 50px rgba(255, 51, 0, 0.08), inset 0 0 0 1px rgba(232, 236, 245, 0.06)'
          } : undefined}>
            <div className="core-label">MBANC / LIVE STATE</div>
            <div className="core-content">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/mbanc-m-logo.png"
                  alt="M"
                  className={`core-logo ${hoveredNode ? 'blurred' : ''}`}
                />
                <div className={`core-app-overlay ${hoveredNode ? 'visible' : ''}`}>
                  {hoveredNode ? hoveredNode.name.replace('\n', ' ') : ''}
                </div>
              </div>
              <div className="core-sub">{coreSub}</div>
              <div className="core-data">
                {coreData.map((d, i) => {
                  const cls = d.cls || (d.v === 'Live' ? 'live-green' : '')
                  return (
                    <div className="cd" key={i}>
                      <div className="k">{d.k}</div>
                      <div className={`v ${cls}`}>
                        {d.v}{d.u && <span className="u">{d.u}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* App Nodes */}
          {NODES.map(node => {
            const Tag = node.href ? 'a' : 'div'
            const props = node.href ? { href: node.href } : {}
            return (
              <Tag
                key={node.id}
                className={`node ${node.soon ? 'soon' : ''}`}
                style={{ '--angle': `${node.angle}deg` }}
                onMouseEnter={() => handleNodeEnter(node)}
                onMouseLeave={handleNodeLeave}
                {...props}
              >
                <div className="node-inner">
                  <div className="node-head">
                    <span className="node-key">{node.id}</span>
                    <span className="node-icon">{node.icon}</span>
                  </div>
                  <div className="node-name" dangerouslySetInnerHTML={{ __html: node.name.replace('\n', '<br/>') }} />
                  <div className="node-stat">
                    {node.hasRateSheet ? (
                      rateSheetFmt
                        ? <><b>Live</b> // Last Upd: {rateSheetFmt}</>
                        : <><b>Live</b> / —</>
                    ) : node.soon ? (
                      'Coming Soon'
                    ) : (
                      <><b>Live</b></>
                    )}
                  </div>
                </div>
              </Tag>
            )
          })}
        </div>

        {/* Command bar */}
        <div className="cmdbar">
          <span className="slash">/</span>
          <span className="cmdbar-text">search mbanc.ai — coming soon</span>
          <span className="kbd-orange">&#9166;</span>
        </div>
      </main>

      <footer className="foot">
        Mortgage Bank of California <span className="sep">&middot;</span> NMLS #38232 <span className="sep">&middot;</span> Internal use only <span className="sep">&middot;</span> Console v3.0
      </footer>
    </>
  )
}
