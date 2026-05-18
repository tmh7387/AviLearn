'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, Package, Maximize2
} from 'lucide-react';

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

export default function SimPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.id as string;

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
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function packageSim() {
    setActionLoading(true);
    try {
      await fetch(`/api/simulations/${simulationId}/package`, { method: 'POST' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="sim-fullpage">
        <div className="sim-fullpage-loading">Loading simulation…</div>
      </div>
    );
  }

  if (!sim) {
    return (
      <div className="sim-fullpage">
        <div className="sim-fullpage-loading">Simulation not found.</div>
      </div>
    );
  }

  const verifier = sim.verifier_output;
  const researcher = sim.researcher_output;
  const showActions = sim.status === 'pending_review' || sim.status === 'revision_requested';

  return (
    <div className="sim-fullpage">
      {/* ── Top bar ── */}
      <header className="sim-fullpage-header">
        <div className="sim-fullpage-header-left">
          <button className="btn btn-ghost" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="sim-fullpage-title-block">
            <h1>{sim.title}</h1>
            <span className="sim-fullpage-subtitle">
              {sim.simulation_types?.display_name || sim.title.split(':')[0]}
              {' · '}
              <span className={`status-text status-${sim.status}`}>
                {sim.status.replace('_', ' ')}
              </span>
            </span>
          </div>
        </div>

        <div className="sim-fullpage-header-right">
          {/* Tab switcher */}
          <div className="sim-fullpage-tabs">
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

          {/* Status actions */}
          {showActions && (
            <div className="sim-fullpage-actions">
              <button
                className="btn btn-outline btn-danger btn-sm"
                onClick={() => updateStatus('rejected')}
                disabled={actionLoading}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => updateStatus('revision_requested')}
                disabled={actionLoading}
              >
                <RotateCcw size={14} /> Request Revision
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => updateStatus('approved')}
                disabled={actionLoading}
              >
                <CheckCircle2 size={14} /> Approve
              </button>
            </div>
          )}
          {sim.status === 'approved' && (
            <button className="btn btn-primary btn-sm" onClick={packageSim} disabled={actionLoading}>
              <Package size={14} /> Package cmi5
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="sim-fullpage-content">
        {activeTab === 'preview' && (
          <iframe
            srcDoc={sim.html_code}
            title="Simulation Preview"
            sandbox="allow-scripts allow-same-origin"
            className="sim-fullpage-iframe"
          />
        )}

        {activeTab === 'details' && verifier && (
          <div className="sim-fullpage-panel">
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
          </div>
        )}

        {activeTab === 'agent' && (
          <div className="sim-fullpage-panel">
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
          </div>
        )}
      </div>
    </div>
  );
}
