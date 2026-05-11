'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import type { PipelineProgress } from '@/lib/agents/types';

interface GenerateModalProps {
  moduleId: string;
  moduleTitle: string;
  courseCode: string;
  onClose: () => void;
  onComplete: (simulationId: string) => void;
}

const STEP_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  classifying: { label: 'Classifying Content Domain', icon: <Zap size={16} /> },
  researching: { label: 'Researching Best Practice', icon: <Sparkles size={16} /> },
  generating: { label: 'Generating Simulation', icon: <Loader2 size={16} className="spin" /> },
  verifying: { label: 'Verifying Quality', icon: <CheckCircle2 size={16} /> },
  complete: { label: 'Complete', icon: <CheckCircle2 size={16} /> },
  error: { label: 'Error', icon: <AlertTriangle size={16} /> },
};

export function GenerateModal({ moduleId, moduleTitle, courseCode, onClose, onComplete }: GenerateModalProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [steps, setSteps] = useState<PipelineProgress[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(async () => {
    setStatus('running');
    setSteps([]);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/simulations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Generation request failed');
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
              const progress: PipelineProgress = JSON.parse(line.slice(6));
              setSteps(prev => [...prev, progress]);

              if (progress.step === 'complete') {
                setStatus('complete');
                setResult(progress.data || null);
              } else if (progress.step === 'error') {
                setStatus('error');
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus('error');
      setSteps(prev => [...prev, {
        step: 'error' as const,
        message: err instanceof Error ? err.message : 'Unknown error',
      }]);
    }
  }, [moduleId]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const currentStep = steps[steps.length - 1]?.step || 'idle';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal sim-generate-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Generate Simulation</h2>
            <p className="modal-subtitle">{moduleTitle} · {courseCode}</p>
          </div>
          <button className="btn btn-ghost" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {status === 'idle' && (
            <div className="sim-generate-intro">
              <div className="sim-generate-icon">
                <Sparkles size={48} />
              </div>
              <h3>AI Simulation Generator</h3>
              <p>
                The agent cluster will analyze this module&apos;s content domain and learning objectives,
                research the most effective simulation type, generate interactive HTML5 code,
                and verify quality — all automatically.
              </p>
              <div className="sim-generate-steps-preview">
                <div className="step-preview"><Zap size={14} /> Classify domain</div>
                <div className="step-preview"><Sparkles size={14} /> Research best practice</div>
                <div className="step-preview"><Loader2 size={14} /> Generate simulation</div>
                <div className="step-preview"><CheckCircle2 size={14} /> Verify quality</div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={startGeneration}>
                <Sparkles size={16} /> Generate Simulation
              </button>
            </div>
          )}

          {(status === 'running' || status === 'complete' || status === 'error') && (
            <div className="sim-pipeline-progress">
              {steps.map((s, i) => {
                const stepInfo = STEP_LABELS[s.step] || { label: s.step, icon: null };
                const isLatest = i === steps.length - 1;
                return (
                  <div
                    key={i}
                    className={`pipeline-step ${s.step === 'error' ? 'step-error' : ''} ${s.step === 'complete' ? 'step-complete' : ''} ${isLatest ? 'step-active' : ''}`}
                  >
                    <div className="step-icon">{stepInfo.icon}</div>
                    <div className="step-content">
                      <div className="step-label">{stepInfo.label}</div>
                      <div className="step-message">{s.message}</div>
                    </div>
                  </div>
                );
              })}

              {status === 'running' && (
                <div className="pipeline-loading">
                  <Loader2 size={20} className="spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          )}

          {status === 'complete' && result && (
            <div className="sim-generate-result">
              <div className="result-header">
                <CheckCircle2 size={24} className="text-success" />
                <span>Simulation Ready for Review</span>
              </div>
              <div className="result-details">
                <div className="result-item">
                  <span className="result-label">Type</span>
                  <span className="result-value">{String(result.simType)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Quality Score</span>
                  <span className="result-value">{String(result.score)}/100</span>
                </div>
                <div className="result-item">
                  <span className="result-label">SME Flags</span>
                  <span className="result-value">{(result.smeFlags as string[])?.length || 0} items</span>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onComplete(String(result.simulationId))}
              >
                Preview Simulation →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
