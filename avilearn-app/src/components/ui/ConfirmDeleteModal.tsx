'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  warningDetails?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  title,
  message,
  warningDetails,
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal sim-generate-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <h2 style={{ fontSize: 16 }}>{title}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--fg-2)', lineHeight: 1.6, fontSize: 13 }}>{message}</p>

          {warningDetails && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--r-sm)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--fg-2)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--danger)' }}>⚠ Warning:</strong>{' '}
              {warningDetails}
            </div>
          )}

          {error && (
            <div
              style={{
                color: 'var(--danger)',
                fontSize: 13,
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={handleConfirm}
            style={{
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spin" /> Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
