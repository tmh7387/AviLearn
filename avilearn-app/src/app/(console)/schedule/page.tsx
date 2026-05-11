import { Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekSchedule } from '@/lib/data/schedule';

export const dynamic = 'force-dynamic';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default async function SchedulePage() {
  const { events, dates, month, year } = await getWeekSchedule();

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Schedule</h1>
          <div className="sub">Week of {month} {dates[0]} – {dates[6]}, {year}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Filter size={14} /> Filter</button>
          <button className="btn btn-primary"><Plus size={14} /> Schedule lesson</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-icon"><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, color: 'var(--fg-1)' }}>{month} {year}</span>
            <button className="btn btn-icon"><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Week', 'Day', 'List'].map((v) => (
              <button
                key={v}
                className="btn btn-secondary"
                style={v === 'Week' ? { background: 'var(--brand)', color: 'var(--canvas)', borderColor: 'var(--brand)' } : {}}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="schedule-grid">
          {DAYS.map((day, i) => (
            <div className="schedule-col" key={day}>
              <div className="schedule-header">
                <div className="day-label">{day}</div>
                <div className="day-num">{dates[i]}</div>
              </div>
              <div className="schedule-events">
                {events
                  .filter((e) => e.dayOfWeek === i)
                  .map((e) => (
                    <div className="schedule-event" key={e.id}>
                      <div className="ev-time" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
                        {e.type}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--fg-1)', fontSize: 13, marginTop: 2 }}>{e.student}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 1 }}>
                        {e.departure && e.arrival ? `${e.departure} → ${e.arrival}` : e.type}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{e.aircraft}</div>
                    </div>
                  ))}
                {events.filter((e) => e.dayOfWeek === i).length === 0 && (
                  <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic' }}>No flights</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
