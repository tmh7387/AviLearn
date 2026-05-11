// Phase 2-4 Agent Types — AI agent cluster type definitions

export type AgentRole =
  | 'supervisor'
  | 'researcher'
  | 'sim_designer'
  | 'verifier'
  | 'intake'
  | 'enrichment'
  | 'transform_router'
  | 'quality_gate'
  | 'packager';

export type ContentDomain =
  | 'rca'
  | 'procedure'
  | 'human_factors'
  | 'ndt_inspection'
  | 'emergency'
  | 'regulatory'
  | 'data_entry'
  | 'hazard_id';

export type SimulationType =
  | 'ishikawa-builder'
  | 'five-why-chain'
  | 'decision-tree'
  | 'step-sequencer'
  | 'drag-drop-matcher'
  | 'hotspot-diagram'
  | 'timed-scenario'
  | 'form-validator'
  | 'branching-story';

export type GenerationStatus =
  | 'generating'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentContext {
  moduleId: string;
  moduleTitle: string;
  courseCode: string;
  learningObjectives: string[];
  contentDomain?: ContentDomain;
  slideContent?: string;
}

export interface SimRecommendation {
  simType: SimulationType;
  confidence: number;
  rationale: string;
  pedagogicBasis: string;
}

export interface GeneratedSimulation {
  simType: SimulationType;
  htmlCode: string;
  xapiVerb: string;
  learningObjective: string;
  smeFlags: string[];
}

export interface AgentDecisionLog {
  agentName: AgentRole;
  action: string;
  inputSummary: string;
  outputSummary: string;
  confidenceScore: number;
  durationMs: number;
  timestamp: string;
}

// Pipeline progress events for streaming UI
export type PipelineStep =
  | 'classifying'
  | 'researching'
  | 'generating'
  | 'verifying'
  | 'complete'
  | 'error';

export interface PipelineProgress {
  step: PipelineStep;
  message: string;
  data?: Record<string, unknown>;
}

// DB row type for generated_simulations table
export interface GeneratedSimulationRow {
  id: string;
  module_id: string;
  sim_type_id: string;
  title: string;
  html_code: string;
  status: GenerationStatus;
  xapi_verb: string;
  learning_objectives: string[] | null;
  sme_flags: string[] | null;
  agent_rationale: string | null;
  researcher_output: Record<string, unknown> | null;
  verifier_output: Record<string, unknown> | null;
  generation_cost_tokens: number | null;
  version: number;
  approved_at: string | null;
  approved_by: string | null;
  cmi5_package_path: string | null;
  created_at: string;
  updated_at: string;
}
