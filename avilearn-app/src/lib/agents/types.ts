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
  | 'packager'
  | 'slide_designer'
  | 'lesson_plan_generator'
  | 'quiz_generator'
  | 'objective_aligner';

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

// --- Slide Studio types ---

export interface ElementContext {
  tagName: string;
  cssSelector: string;
  textPreview: string;
  outerHTML: string;
}

export interface SlideEditMessage {
  role: 'user' | 'assistant';
  content: string;
  elementContext?: ElementContext;
  timestamp: string;
}

export interface SlideVersion {
  versionNumber: number;
  storagePath: string;
  summary: string;
  createdAt: string;
}

// --- Lesson Plan types (course-level) ---

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface SmartObjective {
  text: string;
  bloom_level: BloomLevel;
  action_verb: string;
  conditions: string;
  standard: string;
  audience: string;
}

export interface LessonPlanPhase {
  activities: string;
  content: string;
  time_minutes: number;
}

export interface ModuleTopic {
  topic: string;
  activities: string;
  content: string;
  instructional_method: 'direct' | 'interactive' | 'indirect' | 'experiential';
  time_minutes: number;
}

export interface ConductModule {
  module_title: string;
  objective_indices: number[];
  topics: ModuleTopic[];
  module_evaluation: string;
  total_time_minutes: number;
}

export interface LessonPlanPhases {
  start: LessonPlanPhase;
  conduct: ConductModule[];
  wrap_up: LessonPlanPhase;
}

export interface LessonPlan {
  course_title: string;
  total_time_minutes: number;
  instructor?: string;
  audience_description?: string;
  target_group_size?: string;
  rationale: string;
  learning_objectives: SmartObjective[];
  evaluation_strategy: string;
  instructional_aids: string[];
  phases: LessonPlanPhases;
  notes?: string;
}

// --- Quiz types ---

export type QuizQuestionType =
  | 'mcq_single'
  | 'mcq_multi'
  | 'true_false'
  | 'fill_blank'
  | 'sequence'
  | 'hotspot';

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface QuizQuestion {
  questionType: QuizQuestionType;
  questionText: string;
  options?: QuizQuestionOption[];
  correctAnswer?: string;
  explanation: string;
  bloomLevel: BloomLevel;
  difficulty: number;
  objectiveIndex?: number;
}

// --- Objective Aligner types ---

export type ObjectiveCoverage = 'fully_covered' | 'partially_covered' | 'not_covered';

export interface ObjectiveCoverageResult {
  index: number;
  text: string;
  coverage: ObjectiveCoverage;
  evidence: string;
  suggestion?: string;
}

export interface AlignmentReport {
  objectives: ObjectiveCoverageResult[];
  overallCoverage: number;
  recommendations: string[];
}
