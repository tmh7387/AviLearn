import Link from 'next/link';
import { Pill } from '@/components/ui/Pill';
import { BookOpen, Users } from 'lucide-react';
import { getCourses } from '@/lib/data/courses';
import { CoursesHeader } from '@/components/courses/CoursesHeader';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await getCourses();
  const activeCount = courses.filter((c) => c.statusLabel === 'Active').length;

  return (
    <>
      <CoursesHeader totalCourses={courses.length} activeCourses={activeCount} />

      <div className="courses-grid">
        {courses.map((c) => (
          <Link href={`/courses/${c.id}`} key={c.id} className="card course-card course-card-link">
            <div className="card-head" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>{c.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{c.code}</div>
              </div>
              <Pill kind={c.status === 'success' ? 'success' : c.status === 'neutral' ? undefined : 'info'}>{c.statusLabel}</Pill>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 13 }}>
                <BookOpen size={14} style={{ color: 'var(--fg-3)' }} />
                <span>{c.modules} module{c.modules !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 13 }}>
                <Users size={14} style={{ color: 'var(--fg-3)' }} />
                <span>{c.students} student{c.students !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </Link>
        ))}

        {courses.length === 0 && (
          <div className="empty-state"><p>No courses created yet</p></div>
        )}
      </div>
    </>
  );
}
