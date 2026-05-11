import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { Filter, Download } from 'lucide-react';
import { getGrades } from '@/lib/data/grades';

export const dynamic = 'force-dynamic';

export default async function GradesPage() {
  const grades = await getGrades();

  const pendingCount = grades.filter((g) => g.statusLabel === 'Pending').length;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Grades</h1>
          <div className="sub">{grades.length} entries · {pendingCount} pending review</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Filter size={14} /> Filter</button>
          <button className="btn btn-secondary"><Download size={14} /> Export</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflow: 'hidden', borderRadius: 6 }}>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Module</th>
                <th>Type</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id}>
                  <td className="cell-name">
                    <Avatar name={g.student} />
                    <div className="who">{g.student}</div>
                  </td>
                  <td><Pill>{g.course}</Pill></td>
                  <td className="cell-muted">{g.module}</td>
                  <td style={{ textTransform: 'capitalize' }}>{g.type}</td>
                  <td className="cell-mono" style={{
                    fontWeight: 600,
                    color: g.score === '—' ? 'var(--fg-3)' : Number(g.score.replace('%', '')) >= 80 ? 'var(--brand)' : Number(g.score.replace('%', '')) >= 60 ? 'var(--amber)' : 'var(--danger)',
                  }}>
                    {g.score}
                  </td>
                  <td><Pill kind={g.status}>{g.statusLabel}</Pill></td>
                  <td className="cell-muted">{g.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {grades.length === 0 && (
            <div className="empty-state"><p>No grades recorded yet</p></div>
          )}
        </div>
      </div>
    </>
  );
}
