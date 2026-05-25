import { createAdminClient } from '@/lib/supabase/server';
import type { AgentRole } from './types';

interface LogEntry {
  agentName: AgentRole;
  action: string;
  inputSummary: string;
  outputSummary: string;
  confidenceScore?: number;
  durationMs: number;
  relatedModuleId?: string;
}

export async function logAgentDecision(entry: LogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('agent_logs').insert({
      agent_name: entry.agentName,
      action: entry.action,
      input_summary: entry.inputSummary,
      output_summary: entry.outputSummary,
      confidence_score: entry.confidenceScore ?? null,
      duration_ms: entry.durationMs,
      related_module_id: entry.relatedModuleId ?? null,
    });
  } catch (err) {
    console.error('[AgentLogger] Failed to log decision:', err);
  }
}

export function timer() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
