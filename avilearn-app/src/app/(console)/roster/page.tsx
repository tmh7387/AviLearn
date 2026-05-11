import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { Filter, Plus, Search } from 'lucide-react';
import { getRosterStudents } from '@/lib/data/roster';

export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  const students = await getRosterStudents();

  const activeCount = students.filter((s) => s.status === 'success').length;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Roster</h1>
          <div className="sub">{students.length} enrolled · {activeCount} active</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Filter size={14} /> Filter</button>
          <button className="btn btn-primary"><Plus size={14} /> Add student</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="search-bar" style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }} />
            <input type="text" placeholder="Search students…" style={{
              width: '100%', padding: '8px 12px 8px 32px', background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-1)', fontSize: 13,
            }} />
          </div>
        </div>
        <div style={{ overflow: 'hidden', borderRadius: '0 0 6px 6px' }}>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Flight hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={`${s.id}-${s.course}`}>
                  <td className="cell-name">
                    <Avatar name={s.name} />
                    <div className="who">{s.name}</div>
                  </td>
                  <td className="cell-muted">{s.email}</td>
                  <td><Pill>{s.course}</Pill></td>
                  <td className="cell-mono">{s.hours} hrs</td>
                  <td><Pill kind={s.status}>{s.statusLabel}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="empty-state"><p>No students enrolled yet</p></div>
          )}
        </div>
      </div>
    </>
  );
}
