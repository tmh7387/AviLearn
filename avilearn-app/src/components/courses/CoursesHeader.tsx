'use client';

import { useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import { CreateCourseModal } from './CreateCourseModal';

interface CoursesHeaderProps {
  totalCourses: number;
  activeCourses: number;
}

export function CoursesHeader({ totalCourses, activeCourses }: CoursesHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Courses</h1>
          <div className="sub">
            {totalCourses} course{totalCourses !== 1 ? 's' : ''} · {activeCourses} active
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary">
            <Filter size={14} /> Filter
          </button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Create course
          </button>
        </div>
      </div>

      {modalOpen && <CreateCourseModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
