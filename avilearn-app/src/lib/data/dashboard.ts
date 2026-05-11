import { createClient } from '@/lib/supabase/server';

export async function getDashboardKpis() {
  const supabase = await createClient();

  const [activeStudents, hoursLogged, pendingGrades] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('flight_logs').select('duration_hours'),
    supabase.from('grades').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalHours = (hoursLogged.data || []).reduce(
    (sum, row) => sum + Number(row.duration_hours),
    0
  );

  return {
    activeStudents: activeStudents.count ?? 0,
    hoursLogged: totalHours.toFixed(1),
    pendingGrades: pendingGrades.count ?? 0,
  };
}

export async function getCourseModules(courseCode: string) {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('code', courseCode)
    .single();

  if (!course) return [];

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, sort_order')
    .eq('course_id', course.id)
    .order('sort_order');

  return modules || [];
}

export async function getTodaysFlights() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('flight_logs')
    .select(`
      id, aircraft_registration, flight_date, flight_type, departure, arrival,
      duration_hours, notes,
      student:profiles!flight_logs_student_id_fkey(full_name)
    `)
    .gte('flight_date', today)
    .order('flight_date');

  return (data || []).map((f) => {
    const student = f.student as unknown as { full_name: string } | null;
    return {
      id: f.id,
      aircraft: f.aircraft_registration,
      name: student?.full_name ?? 'Unknown',
      lesson: f.notes || `${f.flight_type || 'Flight'} · ${f.departure || ''} → ${f.arrival || ''}`,
      flightType: f.flight_type,
    };
  });
}

export async function getRecentGrades(limit = 5) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('grades')
    .select(`
      id, assessment_type, score, status, created_at,
      student:profiles!grades_student_id_fkey(full_name),
      lesson:lessons!grades_lesson_id_fkey(title)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((g) => {
    const student = g.student as unknown as { full_name: string } | null;
    const lesson = g.lesson as unknown as { title: string } | null;
    return {
      id: g.id,
      who: student?.full_name ?? 'Unknown',
      text: `${g.status === 'graded' ? 'scored ' + g.score + '% on' : 'submitted'} ${g.assessment_type} · ${lesson?.title ?? ''}`,
      when: timeAgo(g.created_at),
    };
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
