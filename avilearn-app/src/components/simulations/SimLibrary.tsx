'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Eye, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { SimPreview } from './SimPreview';

interface SimRecord {
  id: string;
  title: string;
  status: string;
  sme_flags: string[] | null;
  version: number;
  created_at: string;
  approved_at: string | null;
  cmi5_package_path: string | null;
  verifier_output: { score?: number } | null;
  modules?: { id: string; title: string; courses?: { code: string; name: string } };
  simulation_types?: { name: string; display_name: string };
}

const STATUS_CONFIG: Record<string, { kind?: 'success' | 'warn' | 'danger' | 'info'; icon: React.ReactNode }> = {
  pending_review: { kind: 'warn', icon: <Clock size={12} /> },
  approved: { kind: 'success', icon: <CheckCircle2 size={12} /> },
  rejected: { kind: 'danger', icon: <XCircle size={12} /> },
  revision_requested: { kind: 'info', icon: <RotateCcw size={12} /> },
  generating: { kind: 'info', icon: <Sparkles size={12} /> },
};

export function SimLibrary({ moduleId }: { moduleId?: string }) {
  const [simulations, setSimulations] = useState<SimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchSims = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (moduleId) params.set('moduleId', moduleId);
    if (filter !== 'all') params.set('status', filter);

    const res = await fetch(`/api/simulations/library?${params}`);
    const data = await res.json();
    setSimulations(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [moduleId, filter]);

  useEffect(() => { fetchSims(); }, [fetchSims]);

  const filtered = simulations;

  return (
    <div className="sim-library">
      <div className="sim-library-filters">
        {['all', 'pending_review', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            className={`btn btn-ghost filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
            {f !== 'all' && (
              <span className="filter-count">
                {simulations.filter(s => s.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sim-library-loading">Loading simulations...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Sparkles size={40} style={{ color: 'var(--fg-3)', marginBottom: 12 }} />
          <p>No simulations generated yet</p>
          <p className="empty-state-sub">
            Navigate to a module and click &quot;Generate Simulation&quot; to create your first AI-powered simulation.
          </p>
        </div>
      ) : (
        <div className="sim-library-grid">
          {filtered.map(sim => {
            const statusCfg = STATUS_CONFIG[sim.status] || {};
            const score = sim.verifier_output?.score;
            return (
              <div className="card sim-card" key={sim.id}>
                <div className="card-head" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="sim-card-title">{sim.simulation_types?.display_name || sim.title.split(':')[0]}</h3>
                    <div className="sim-card-module">
                      {sim.modules?.courses?.code} · {sim.modules?.title}
                    </div>
                  </div>
                  <Pill kind={statusCfg.kind}>
                    {statusCfg.icon} {sim.status.replace('_', ' ')}
                  </Pill>
                </div>

                <div className="card-body sim-card-body">
                  <div className="sim-card-meta">
                    {score !== undefined && (
                      <div className="sim-meta-item">
                        <span className="label">Score</span>
                        <span className={`value ${score >= 70 ? 'text-success' : 'text-danger'}`}>
                          {score}/100
                        </span>
                      </div>
                    )}
                    {sim.sme_flags && sim.sme_flags.length > 0 && (
                      <div className="sim-meta-item">
                        <AlertTriangle size={12} style={{ color: 'var(--warn)' }} />
                        <span>{sim.sme_flags.length} SME flags</span>
                      </div>
                    )}
                    <div className="sim-meta-item">
                      <span className="label">v{sim.version}</span>
                      <span className="value">{new Date(sim.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm sim-preview-btn"
                    onClick={() => setPreviewId(sim.id)}
                  >
                    <Eye size={14} /> Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewId && (
        <SimPreview
          simulationId={previewId}
          onClose={() => setPreviewId(null)}
          onStatusChange={fetchSims}
        />
      )}
    </div>
  );
}
