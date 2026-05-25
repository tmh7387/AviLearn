import { createAdminClient } from '@/lib/supabase/server';

export interface CourseCard {
  id: string;
  code: string;
  name: string;
  modules: number;
  students: number;
  status: 'success' | 'info' | 'neutral';
  statusLabel: string;
}

const STATUS_MAP: Record<string, { kind: CourseCard['status']; label: string }> = {
  active: { kind: 'success', label: 'Active' },
  draft: { kind: 'neutral', label: 'Draft' },
  archived: { kind: 'info', label: 'Archived' },
};

export async function getCourses(): Promise<CourseCard[]> {
  const supabase = createAdminClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, code, name, status')
    .order('status');

  if (!courses) return [];

  const courseIds = courses.map((c) => c.id);

  const [moduleRes, enrollRes] = await Promise.all([
    supabase
      .from('modules')
      .select('course_id')
      .in('course_id', courseIds),
    supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('status', 'active'),
  ]);

  const moduleCounts: Record<string, number> = {};
  (moduleRes.data || []).forEach((m) => {
    moduleCounts[m.course_id] = (moduleCounts[m.course_id] || 0) + 1;
  });

  const enrollCounts: Record<string, number> = {};
  (enrollRes.data || []).forEach((e) => {
    enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
  });

  return courses.map((c) => {
    const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.active;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      modules: moduleCounts[c.id] || 0,
      students: enrollCounts[c.id] || 0,
      status: statusInfo.kind,
      statusLabel: statusInfo.label,
    };
  });
}
