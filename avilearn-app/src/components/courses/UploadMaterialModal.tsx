'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle, Sparkles, Upload, FileSpreadsheet, Share2, Database, FileText } from 'lucide-react';

interface UploadMaterialModalProps {
  moduleId: string;
  moduleTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface IngestionProgress {
  step: 'intake' | 'enrichment' | 'routing' | 'saving' | 'complete' | 'error';
  message: string;
}

const STEP_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  intake: { label: 'Ingesting File Content', icon: <FileSpreadsheet size={16} /> },
  enrichment: { label: 'Enriching Slide Metadata', icon: <Sparkles size={16} /> },
  routing: { label: 'Routing & Slide Layouts', icon: <Share2 size={16} /> },
  saving: { label: 'Saving Lessons & Storage', icon: <Database size={16} /> },
  complete: { label: 'Complete', icon: <CheckCircle2 size={16} /> },
  error: { label: 'Error', icon: <AlertTriangle size={16} /> },
};

export function UploadMaterialModal({ moduleId, moduleTitle, onClose, onSuccess }: UploadMaterialModalProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [steps, setSteps] = useState<IngestionProgress[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startIngestion = useCallback(async () => {
    if (!selectedFile) return;

    setStatus('running');
    setSteps([]);
    abortRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('moduleId', moduleId);

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Transformation request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const progress: IngestionProgress = JSON.parse(line.slice(6));
              setSteps(prev => {
                // If the step is already the latest, replace its message, otherwise append
                if (prev.length > 0 && prev[prev.length - 1].step === progress.step) {
                  const copy = [...prev];
                  copy[copy.length - 1] = progress;
                  return copy;
                }
                return [...prev, progress];
              });

              if (progress.step === 'complete') {
                setStatus('complete');
              } else if (progress.step === 'error') {
                setStatus('error');
              }
            } catch {
              // ignore json parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus('error');
      setSteps(prev => [...prev, {
        step: 'error',
        message: err instanceof Error ? err.message : 'Unknown error occurred.',
      }]);
    }
  }, [selectedFile, moduleId]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal sim-generate-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2>Import Learning Materials</h2>
            <p className="modal-subtitle">{moduleTitle}</p>
          </div>
          <button className="btn btn-ghost" onClick={handleClose} disabled={status === 'running'}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed var(--brand)' : '1px dashed var(--border)',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--r-sm)',
                  padding: '32px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pptx,.pdf"
                  style={{ display: 'none' }}
                />
                <div style={{ color: 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedFile ? <FileText size={36} style={{ color: 'var(--brand)' }} /> : <Upload size={36} />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                    {selectedFile ? selectedFile.name : 'Select or drop file here'}
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
                    Supports PowerPoint (.pptx) and PDF (.pdf) manuals up to 50MB.
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={startIngestion}
                disabled={!selectedFile}
                style={{ alignSelf: 'stretch' }}
              >
                <Sparkles size={16} /> Transform Content →
              </button>
            </div>
          )}

          {(status === 'running' || status === 'complete' || status === 'error') && (
            <div className="sim-pipeline-progress" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {steps.map((s, i) => {
                const stepInfo = STEP_LABELS[s.step] || { label: s.step, icon: null };
                const isLatest = i === steps.length - 1;
                return (
                  <div
                    key={i}
                    className={`pipeline-step ${s.step === 'error' ? 'step-error' : ''} ${s.step === 'complete' ? 'step-complete' : ''} ${isLatest && status === 'running' ? 'step-active' : ''}`}
                  >
                    <div className="step-icon">
                      {s.step === 'complete' ? <CheckCircle2 size={16} /> : isLatest && status === 'running' ? <Loader2 size={16} className="spin" /> : stepInfo.icon}
                    </div>
                    <div className="step-content">
                      <div className="step-label">{stepInfo.label}</div>
                      <div className="step-message">{s.message}</div>
                    </div>
                  </div>
                );
              })}

              {status === 'running' && steps.length === 0 && (
                <div className="pipeline-loading">
                  <Loader2 size={20} className="spin" />
                  <span>Initiating agent pipeline...</span>
                </div>
              )}
            </div>
          )}

          {status === 'complete' && (
            <div className="sim-generate-result" style={{ marginTop: 16 }}>
              <div className="result-header">
                <CheckCircle2 size={24} className="text-success" />
                <span>Transformation Successful</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 8, lineHeight: 1.5 }}>
                The content transformation agent pipeline successfully ingested your material, classified the slide themes, and generated organized, animated HTML slide lessons.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                style={{ marginTop: 16 }}
              >
                Return to Course View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
