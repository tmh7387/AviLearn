import { Sparkles, Zap } from 'lucide-react';
import { SimLibrary } from '@/components/simulations/SimLibrary';

export const dynamic = 'force-dynamic';

export default function SimulationsPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <h1><Zap size={22} style={{ display: 'inline', marginRight: 8, color: 'var(--accent)' }} />Simulations</h1>
          <div className="sub">AI-generated interactive simulations</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled>
            <Sparkles size={14} /> Generate from module
          </button>
        </div>
      </div>

      <SimLibrary />
    </>
  );
}
