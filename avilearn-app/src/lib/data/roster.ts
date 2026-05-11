import { createClient } from '@/lib/supabase/server';

export interface RosterStudent {
  id: string;
  name: string;
  email: string;
  course: string;
  hours: string;
  status: 'success' | 'warn' | 'danger' | 'info';
  statusLabel: string;
}

const STATUS_MAP: Record<string, { kind: RosterStudent['status']; label: string }> = {
  active: { kind: 'success', label: 'Active' },
  pending: { kind: 'warn', label: 'Pending' },
  withdrawn: { kind: 'danger', label: 'Withdrawn' },
  completed: { kind: 'info', label: 'Completed' },
};

export async function getRosterStudents(): Promise<RosterStudent[]> {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      status,
      student:profiles!enrollments_student_id_fkey(id, full_name, email),
      course:courses!enrollments_course_id_fkey(code)
    `)
    .order('status');

  if (!enrollments) return [];

  const studentIds = enrollments
    .map((e) => {
      const student = e.student as unknown as { id: string } | null;
      return student?.id;
    })
    .filter(Boolean) as string[];

  const { data: flightLogs } = await supabase
    .from('flight_logs')
    .select('student_id, duration_hours')
    .in('student_id', studentIds);

  const hoursMap: Record<string, number> = {};
  (flightLogs || []).forEach((f) => {
    hoursMap[f.student_id] = (hoursMap[f.student_id] || 0) + Number(f.duration_hours);
  });

  return enrollments.map((e) => {
    const student = e.student as unknown as { id: string; full_name: string; email: string };
    const course = e.course as unknown as { code: string };
    const statusInfo = STATUS_MAP[e.status] || STATUS_MAP.active;

    return {
      id: student.id,
      name: student.full_name,
      email: student.email,
      course: course.code,
      hours: (hoursMap[student.id] || 0).toFixed(1),
      status: statusInfo.kind,
      statusLabel: statusInfo.label,
    };
  });
}
