'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, BookOpen, Target, Clock, ChevronLeft, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui/Pill';
import { GenerateModal } from '@/components/simulations/GenerateModal';
import { SimLibrary } from '@/components/simulations/SimLibrary';
import { SimPreview } from '@/components/simulations/SimPreview';
import { CreateLessonModal } from '@/components/courses/CreateLessonModal';
import { UploadMaterialModal } from '@/components/courses/UploadMaterialModal';

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  learning_objectives: string[] | null;
  lessons: { id: string; title: string; content_type: string; duration_minutes: number | null; sort_order: number }[];
  courses: { code: string; name: string };
  error?: string;
}

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [mod, setMod] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`/api/modules/${moduleId}`)
      .then(r => r.json())
      .then(data => { setMod(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [moduleId, refreshKey]);

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--fg-3)' }}>Loading module...</div>;
  }

  if (!mod || mod.error) {
    return <div style={{ padding: 40, color: 'var(--fg-3)' }}>Module not found</div>;
  }

  return (
    <>
      <div className="page-title">
        <div>
          <Link href={`/courses/${params.courseId}`} className="breadcrumb-link">
            <ChevronLeft size={14} /> Course details
          </Link>
          <h1>{mod.title}</h1>
          <div className="sub">{mod.courses?.code} · {mod.courses?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={14} /> Upload Content
          </button>
          <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
            <Sparkles size={14} /> Generate Simulation
          </button>
        </div>
      </div>

      {/* Module Overview */}
      <div className="module-detail-grid">
        <div className="card module-info-card">
          <div className="card-head"><h3>Module Overview</h3></div>
          <div className="card-body">
            {mod.description && <p style={{ color: 'var(--fg-2)', marginBottom: 16, lineHeight: 1.6 }}>{mod.description}</p>}

            {mod.learning_objectives && mod.learning_objectives.length > 0 && (
              <div className="objectives-section">
                <h4><Target size={14} /> Learning Objectives</h4>
                <ul className="objectives-list">
                  {mod.learning_objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="card module-lessons-card">
          <div className="card-head" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <h3><BookOpen size={14} /> Lessons ({mod.lessons?.length || 0})</h3>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowAddLesson(true)}
            >
              <Plus size={12} /> Add Lesson
            </button>
          </div>
          <div className="card-body">
            {mod.lessons?.sort((a, b) => a.sort_order - b.sort_order).map(lesson => (
              <div className="lesson-item" key={lesson.id}>
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-meta">
                  <Pill kind={lesson.content_type === 'simulation' ? 'brand' : undefined}>
                    {lesson.content_type}
                  </Pill>
                  {lesson.duration_minutes && (
                    <span className="lesson-duration"><Clock size={12} /> {lesson.duration_minutes}m</span>
                  )}
                </div>
              </div>
            ))}
            {(!mod.lessons || mod.lessons.length === 0) && (
              <p style={{ color: 'var(--fg-3)' }}>No lessons yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Generated Simulations for this module */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--fg-1)' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)', marginRight: 8 }} />
          Generated Simulations
        </h2>
        <SimLibrary key={refreshKey} moduleId={moduleId} />
      </div>

      {showGenerate && (
        <GenerateModal
          moduleId={moduleId}
          moduleTitle={mod.title}
          courseCode={mod.courses?.code || ''}
          onClose={() => setShowGenerate(false)}
          onComplete={(simId) => {
            setShowGenerate(false);
            setPreviewId(simId);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {previewId && (
        <SimPreview
          simulationId={previewId}
          onClose={() => setPreviewId(null)}
          onStatusChange={() => setRefreshKey(k => k + 1)}
        />
      )}

      {showAddLesson && (
        <CreateLessonModal
          moduleId={moduleId}
          onClose={() => setShowAddLesson(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}

      {showUpload && (
        <UploadMaterialModal
          moduleId={moduleId}
          moduleTitle={mod.title}
          onClose={() => setShowUpload(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}
    </>
  );
}

