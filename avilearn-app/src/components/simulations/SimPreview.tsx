'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Package } from 'lucide-react';

interface SimPreviewProps {
  simulationId: string;
  onClose: () => void;
  onStatusChange?: () => void;
}

interface SimulationData {
  id: string;
  title: string;
  status: string;
  html_code: string;
  xapi_verb: string;
  sme_flags: string[] | null;
  agent_rationale: string | null;
  learning_objectives: string[] | null;
  verifier_output: {
    score?: number;
    passed?: boolean;
    feedback?: string;
    smeFlags?: string[];
    interactivityLevel?: string;
    accessibilityNotes?: string;
    objectivesCovered?: string[];
    objectivesMissing?: string[];
  } | null;
  researcher_output: {
    simType?: string;
    confidence?: number;
    rationale?: string;
    pedagogicBasis?: string;
  } | null;
  modules?: { title: string; courses?: { code: string; name: string } };
  simulation_types?: { name: string; display_name: string };
}

export function SimPreview({ simulationId, onClose, onStatusChange }: SimPreviewProps) {
  const [sim, setSim] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'agent'>('preview');

  useEffect(() => {
    fetch(`/api/simulations/${simulationId}`)
      .then(r => r.json())
      .then(data => { setSim(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [simulationId]);

  async function updateStatus(newStatus: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/simulations/${simulationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSim(prev => prev ? { ...prev, status: updated.status } : null);
        onStatusChange?.();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function packageSim() {
    setActionLoading(true);
    try {
      await fetch(`/api/simulations/${simulationId}/package`, { method: 'POST' });
      onStatusChange?.();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal sim-preview-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-body" style={{ textAlign: 'center', padding: 60 }}>
            Loading simulation...
          </div>
        </div>
      </div>
    );
  }

  if (!sim) return null;

  const verifier = sim.verifier_output;
  const researcher = sim.researcher_output;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sim-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{sim.title}</h2>
            <p className="modal-subtitle">
              {sim.simulation_types?.display_name || sim.title.split(':')[0]}
              {' · '}
              <span className={`status-text status-${sim.status}`}>{sim.status.replace('_', ' ')}</span>
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="sim-preview-tabs">
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Verification
          </button>
          <button
            className={`tab ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            Agent Rationale
          </button>
        </div>

        <div className="modal-body sim-preview-body">
          {activeTab === 'preview' && (
            <div className="sim-iframe-container">
              <iframe
                srcDoc={sim.html_code}
                title="Simulation Preview"
                sandbox="allow-scripts allow-same-origin"
                className="sim-iframe"
              />
            </div>
          )}

          {activeTab === 'details' && verifier && (
            <div className="sim-details-panel">
              <div className="detail-section">
                <h4>Quality Score</h4>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${verifier.score || 0}%`,
                      backgroundColor: (verifier.score || 0) >= 70 ? 'var(--accent)' : 'var(--danger)',
                    }}
                  />
                  <span className="score-text">{verifier.score}/100</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Interactivity</h4>
                <span className="pill">{verifier.interactivityLevel || 'N/A'}</span>
              </div>

              <div className="detail-section">
                <h4>Feedback</h4>
                <p>{verifier.feedback}</p>
              </div>

              {verifier.accessibilityNotes && (
                <div className="detail-section">
                  <h4>Accessibility</h4>
                  <p>{verifier.accessibilityNotes}</p>
                </div>
              )}

              {verifier.smeFlags && verifier.smeFlags.length > 0 && (
                <div className="detail-section">
                  <h4>
                    <AlertTriangle size={14} style={{ color: 'var(--warn)' }} /> SME Review Items
                  </h4>
                  <ul className="sme-flags-list">
                    {verifier.smeFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-section">
                <h4>Objectives Covered</h4>
                <ul>{verifier.objectivesCovered?.map((o, i) => <li key={i} className="covered">{o}</li>)}</ul>
              </div>

              {verifier.objectivesMissing && verifier.objectivesMissing.length > 0 && (
                <div className="detail-section">
                  <h4>Objectives Missing</h4>
                  <ul>{verifier.objectivesMissing.map((o, i) => <li key={i} className="missing">{o}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="sim-agent-panel">
              {researcher && (
                <div className="detail-section">
                  <h4>Researcher Recommendation</h4>
                  <div className="agent-card">
                    <div className="agent-field">
                      <span className="label">Sim Type:</span>
                      <span>{researcher.simType}</span>
                    </div>
                    <div className="agent-field">
                      <span className="label">Confidence:</span>
                      <span>{((researcher.confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="agent-field">
                      <span className="label">Rationale:</span>
                      <p>{researcher.rationale}</p>
                    </div>
                    <div className="agent-field">
                      <span className="label">Pedagogic Basis:</span>
                      <p>{researcher.pedagogicBasis}</p>
                    </div>
                  </div>
                </div>
              )}
              {sim.agent_rationale && (
                <div className="detail-section">
                  <h4>Full Agent Rationale</h4>
                  <pre className="agent-rationale-pre">{sim.agent_rationale}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {(sim.status === 'pending_review' || sim.status === 'revision_requested') && (
          <div className="modal-footer">
            <button
              className="btn btn-outline btn-danger"
              onClick={() => updateStatus('rejected')}
              disabled={actionLoading}
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => updateStatus('revision_requested')}
              disabled={actionLoading}
            >
              <RotateCcw size={14} /> Request Revision
            </button>
            <button
              className="btn btn-primary"
              onClick={() => updateStatus('approved')}
              disabled={actionLoading}
            >
              <CheckCircle2 size={14} /> Approve
            </button>
          </div>
        )}

        {sim.status === 'approved' && (
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={packageSim} disabled={actionLoading}>
              <Package size={14} /> Package as cmi5 AU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
