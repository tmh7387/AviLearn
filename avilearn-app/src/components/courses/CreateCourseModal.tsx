'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

interface CreateCourseModalProps {
  onClose: () => void;
}

export function CreateCourseModal({ onClose }: CreateCourseModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Code and Name are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create course');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sim-generate-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2>Create New Course</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Course Code</label>
              <input
                type="text"
                placeholder="e.g. PPL, IFR, ATPL"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg-1)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  outline: 'none',
                }}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Course Name</label>
              <input
                type="text"
                placeholder="e.g. Private Pilot License"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg-1)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  outline: 'none',
                }}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Description</label>
              <textarea
                placeholder="Brief description of the course objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 80,
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg-1)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'active')}
                style={{
                  width: '100%',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg-1)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  outline: 'none',
                }}
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} className="spin" /> Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
