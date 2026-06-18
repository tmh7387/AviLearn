'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Target, Sparkles, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { CreateModuleModal } from '@/components/courses/CreateModuleModal';
import { EditCourseModal } from '@/components/courses/EditCourseModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface CourseData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  modules: {
    id: string;
    title: string;
    description: string | null;
    sort_order: number;
    learning_objectives: string[] | null;
  }[];
  error?: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then(data => { setCourse(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [courseId, refreshKey]);

  if (loading) return <div style={{ padding: 40, color: 'var(--fg-3)' }}>Loading course...</div>;
  if (!course || course.error) return <div style={{ padding: 40, color: 'var(--fg-3)' }}>Course not found</div>;

  const sorted = [...(course.modules || [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="page-title">
        <div>
          <Link href="/courses" className="breadcrumb-link">
            <ChevronLeft size={14} /> Courses
          </Link>
          <h1>{course.name}</h1>
          <div className="sub">{course.code} · {sorted.length} modules</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteCourse(true)}
            style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={14} />
          </button>
          <button className="btn btn-secondary" onClick={() => setShowEditCourse(true)}>
            <Pencil size={14} /> Edit Course
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModule(true)}>
            <Plus size={14} /> Add Module
          </button>
        </div>
      </div>

      {course.description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <p style={{ color: 'var(--fg-2)', lineHeight: 1.6 }}>{course.description}</p>
          </div>
        </div>
      )}

      <div className="modules-list">
        {sorted.map((mod, idx) => (
          <Link
            key={mod.id}
            href={`/courses/${courseId}/modules/${mod.id}`}
            className="card module-list-card"
          >
            <div className="module-list-number">{idx + 1}</div>
            <div className="module-list-content">
              <h3 className="module-list-title">{mod.title}</h3>
              {mod.description && (
                <p className="module-list-desc">{mod.description}</p>
              )}
              <div className="module-list-meta">
                {mod.learning_objectives && (
                  <Pill>
                    <Target size={10} /> {mod.learning_objectives.length} objectives
                  </Pill>
                )}
                <Pill kind="brand">
                  <Sparkles size={10} /> Generate Sim
                </Pill>
              </div>
            </div>
            <ChevronRight size={18} className="module-list-arrow" />
          </Link>
        ))}

        {sorted.length === 0 && (
          <div className="empty-state"><p>No modules in this course yet</p></div>
        )}
      </div>

      {showAddModule && (
        <CreateModuleModal
          courseId={courseId}
          onClose={() => setShowAddModule(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}

      {showEditCourse && course && (
        <EditCourseModal
          course={course}
          onClose={() => setShowEditCourse(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}

      {showDeleteCourse && course && (
        <ConfirmDeleteModal
          title="Delete Course"
          message={`Are you sure you want to delete "${course.name}"? This action cannot be undone.`}
          warningDetails={`This will permanently delete the course, all ${sorted.length} module${sorted.length !== 1 ? 's' : ''}, their lessons, generated simulations, and any associated content.`}
          confirmLabel="Delete Course"
          onClose={() => setShowDeleteCourse(false)}
          onConfirm={async () => {
            const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error || 'Failed to delete course');
            }
            router.push('/courses');
          }}
        />
      )}
    </>
  );
}

