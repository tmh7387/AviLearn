'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';

interface CreateModuleModalProps {
  courseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateModuleModal({ courseId, onClose, onSuccess }: CreateModuleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [objectives, setObjectives] = useState<string[]>(['']);

  const handleAddObjective = () => {
    setObjectives([...objectives, '']);
  };

  const handleRemoveObjective = (index: number) => {
    const updated = objectives.filter((_, idx) => idx !== index);
    setObjectives(updated.length > 0 ? updated : ['']);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    // Filter out empty learning objectives
    const filteredObjectives = objectives
      .map((o) => o.trim())
      .filter((o) => o !== '');

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: title.trim(),
          description: description.trim() || null,
          learningObjectives: filteredObjectives.length > 0 ? filteredObjectives : null,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create module');
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
      <div className="modal sim-generate-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
        <div className="modal-header">
          <div>
            <h2>Add New Module</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Module Title</label>
              <input
                type="text"
                placeholder="e.g. Ishikawa (Fishbone) Diagrams"
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Description</label>
              <textarea
                placeholder="Overview of this module's topics and context..."
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

            <div style={{ display: 'flex', gap: 16 }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Learning Objectives</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {objectives.map((obj, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={`Objective #${index + 1}`}
                      value={obj}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      style={{
                        flex: 1,
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
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: 8,
                          borderRadius: 'var(--r-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleAddObjective}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--brand)',
                  padding: '6px 12px',
                }}
                disabled={loading}
              >
                <Plus size={14} /> Add Objective
              </button>
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
                'Add Module'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
