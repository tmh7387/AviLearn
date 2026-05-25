'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

interface CreateLessonModalProps {
  moduleId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLessonModal({ moduleId, onClose, onSuccess }: CreateLessonModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'html' | 'video' | 'simulation' | 'quiz' | 'pptx' | 'pdf'>('html');
  const [contentUrl, setContentUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [sortOrder, setSortOrder] = useState<number>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentType) {
      setError('Title and Content Type are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          title: title.trim(),
          contentType,
          contentUrl: contentUrl.trim() || null,
          durationMinutes: Number(durationMinutes) || null,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create lesson');
      }

      router.refresh();
      if (onSuccess) onSuccess();
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
            <h2>Add New Lesson</h2>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Lesson Title</label>
              <input
                type="text"
                placeholder="e.g. Overview of Active Failures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'html' | 'video' | 'simulation' | 'quiz' | 'pptx' | 'pdf')}
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
                >
                  <option value="html">HTML slide / text</option>
                  <option value="video">Video file / stream</option>
                  <option value="simulation">Interactive simulation</option>
                  <option value="quiz">Assessment quiz</option>
                  <option value="pptx">PowerPoint slides (.pptx)</option>
                  <option value="pdf">Document guide (.pdf)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Content URL / Path (Optional)</label>
              <input
                type="text"
                placeholder="e.g. courses/rca-14/video.mp4"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
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
              />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
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
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
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
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} className="spin" /> Saving...
                </>
              ) : (
                'Add Lesson'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
