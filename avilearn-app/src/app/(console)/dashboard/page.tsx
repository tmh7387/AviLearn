import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { Download, Plus } from 'lucide-react';
import { getDashboardKpis, getCourseModules, getTodaysFlights, getRecentGrades } from '@/lib/data/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [kpis, modules, flights, activity] = await Promise.all([
    getDashboardKpis(),
    getCourseModules('PPL'),
    getTodaysFlights(),
    getRecentGrades(5),
  ]);

  const KPIS = [
    { label: 'Active students', value: String(kpis.activeStudents), delta: 'Across all courses', kind: '' },
    { label: 'Hours logged', value: kpis.hoursLogged, delta: 'Total flight hours', kind: 'k-info' },
    { label: 'Pending grades', value: String(kpis.pendingGrades), delta: `${kpis.pendingGrades} awaiting review`, kind: 'k-warn' },
    { label: 'Aircraft AOG', value: '1', delta: 'N1234A · scheduled return Wed', kind: 'k-danger' },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Welcome back, Anne</h1>
          <div className="sub">{kpis.pendingGrades} grades need review · 1 aircraft AOG · clear weather at KSFO</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Download size={14} /> Export</button>
          <button className="btn btn-primary"><Plus size={14} /> Schedule lesson</button>
        </div>
      </div>

      <div className="kpi-strip">
        {KPIS.map((k, i) => (
          <div key={i} className={`kpi ${k.kind}`}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="delta">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="stack">
          {/* Course modules */}
          <div className="card">
            <div className="card-head">
              <h3>PPL ground school</h3>
              <span className="eye">{modules.length} modules</span>
            </div>
            <div>
              {modules.length > 0 ? modules.map((m, i) => (
                <div className="lesson" key={m.id}>
                  <div className="num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="title">
                    <h4>{m.title}</h4>
                    <small>PPL · Module {m.sort_order}</small>
                  </div>
                </div>
              )) : (
                <div className="empty-state"><p>No modules found</p></div>
              )}
            </div>
          </div>

          {/* Today's flights */}
          <div className="card">
            <div className="card-head">
              <h3>Recent flights</h3>
              <span className="eye">{flights.length} flights</span>
            </div>
            <div style={{ overflow: 'hidden', borderRadius: 6 }}>
              {flights.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Student</th><th>Aircraft</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {flights.map((f) => (
                      <tr key={f.id}>
                        <td className="cell-name">
                          <Avatar name={f.name} />
                          <div className="who">{f.name}</div>
                        </td>
                        <td className="cell-mono">{f.aircraft}</td>
                        <td className="cell-muted">{f.lesson}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state"><p>No flights recorded yet</p></div>
              )}
            </div>
          </div>
        </div>

        <div className="stack">
          {/* METAR (static — would need weather API) */}
          <div className="card">
            <div className="card-head"><h3>METAR · KSFO</h3><span className="eye">Live</span></div>
            <div className="card-body" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--brand)' }}>KSFO 121245Z 27015KT 10SM</span> FEW035 BKN200 14/09 A3002<br />
              <span style={{ color: 'var(--fg-3)' }}>RMK AO2 SLP168 T01390094</span>
              <div style={{ marginTop: 12, display: 'flex', gap: 16, color: 'var(--fg-1)', fontFamily: 'var(--font-sans)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Wind</div>
                  <div style={{ fontWeight: 600 }}>270° / 15 kt</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Vis</div>
                  <div style={{ fontWeight: 600 }}>10 SM</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Ceiling</div>
                  <div style={{ fontWeight: 600 }}>BKN 200</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card">
            <div className="card-head"><h3>Recent activity</h3></div>
            <div className="card-body">
              {activity.length > 0 ? activity.map((a) => (
                <div className="activity" key={a.id}>
                  <Avatar name={a.who} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div className="text"><strong style={{ color: 'var(--fg-1)' }}>{a.who}</strong> <span style={{ color: 'var(--fg-2)' }}>{a.text}</span></div>
                    <div className="when">{a.when}</div>
                  </div>
                </div>
              )) : (
                <div className="empty-state"><p>No recent activity</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
