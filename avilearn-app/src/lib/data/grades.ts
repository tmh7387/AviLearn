import { createAdminClient } from '@/lib/supabase/server';

export interface GradeRow {
  id: string;
  student: string;
  course: string;
  module: string;
  type: string;
  score: string;
  status: 'success' | 'warn' | 'danger';
  statusLabel: string;
  date: string;
}

const STATUS_MAP: Record<string, { kind: GradeRow['status']; label: string }> = {
  graded: { kind: 'success', label: 'Graded' },
  passed: { kind: 'success', label: 'Passed' },
  pending: { kind: 'warn', label: 'Pending' },
  failed: { kind: 'danger', label: 'Failed' },
};

export async function getGrades(): Promise<GradeRow[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('grades')
    .select(`
      id, assessment_type, score, status, created_at,
      student:profiles!grades_student_id_fkey(full_name),
      lesson:lessons!grades_lesson_id_fkey(
        title,
        module:modules!lessons_module_id_fkey(
          title,
          course:courses!modules_course_id_fkey(code)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map((g) => {
    const studentName = (g.student as unknown as { full_name: string } | null)?.full_name ?? 'Unknown';
    const lesson = g.lesson as unknown as { title: string; module: { title: string; course: { code: string } } } | null;
    const statusInfo = STATUS_MAP[g.status] || STATUS_MAP.pending;

    return {
      id: g.id,
      student: studentName,
      course: lesson?.module?.course?.code ?? '—',
      module: lesson?.module?.title ?? '—',
      type: g.assessment_type,
      score: g.score != null ? `${g.score}%` : '—',
      status: statusInfo.kind,
      statusLabel: statusInfo.label,
      date: g.created_at?.split('T')[0] ?? '',
    };
  });
}
