import { createAdminClient } from '@/lib/supabase/server';

export interface ScheduleEvent {
  id: string;
  student: string;
  aircraft: string;
  type: string;
  departure: string;
  arrival: string;
  date: string;
  dayOfWeek: number; // 0=Mon .. 6=Sun
}

export async function getWeekSchedule(): Promise<{
  events: ScheduleEvent[];
  weekStart: string;
  weekEnd: string;
  dates: number[];
  month: string;
  year: number;
}> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStart = monday.toISOString().split('T')[0];
  const weekEnd = sunday.toISOString().split('T')[0];

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });

  const month = monday.toLocaleString('en-US', { month: 'long' });
  const year = monday.getFullYear();

  const supabase = createAdminClient();

  const { data } = await supabase
    .from('flight_logs')
    .select(`
      id, aircraft_registration, flight_type, flight_date, departure, arrival,
      student:profiles!flight_logs_student_id_fkey(full_name)
    `)
    .gte('flight_date', weekStart)
    .lte('flight_date', weekEnd)
    .order('flight_date');

  const events: ScheduleEvent[] = (data || []).map((f) => {
    const flightDate = new Date(f.flight_date + 'T00:00:00');
    const dow = flightDate.getDay();
    const mondayIndex = dow === 0 ? 6 : dow - 1;

    return {
      id: f.id,
      student: (f.student as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
      aircraft: f.aircraft_registration,
      type: formatFlightType(f.flight_type),
      departure: f.departure || '',
      arrival: f.arrival || '',
      date: f.flight_date,
      dayOfWeek: mondayIndex,
    };
  });

  return { events, weekStart, weekEnd, dates, month, year };
}

function formatFlightType(type: string | null): string {
  const labels: Record<string, string> = {
    dual: 'Dual instruction',
    solo: 'Solo flight',
    cross_country: 'Cross-country',
    night: 'Night flight',
    instrument: 'Instrument practice',
    checkride: 'Checkride',
  };
  return type ? labels[type] || type : 'Flight';
}
