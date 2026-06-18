// Phase 3 — Content Transformation Pipeline types

export type SourceFormat = 'pptx' | 'pdf' | 'docx' | 'mp4' | 'html';
export type OutputFormat = 'html5_slides' | 'video_mp4' | 'simulation' | 'scorm_zip' | 'cmi5_au';

export type SlideClassification =
  | 'text_heavy'
  | 'diagram'
  | 'procedure_checklist'
  | 'data_chart'
  | 'title_slide'
  | 'image_heavy'
  | 'quiz_exercise';

// --- Enriched slide sub-types for visual content ---

export interface SlideImage {
  id: string;
  base64: string;
  width: number;
  height: number;
  altText: string;
  contentType?: string;
  sizeBytes?: number;
  groupId?: string;
}

export interface SlideShape {
  name: string;
  type: string;
  shapeId: number;
  left: number;
  top: number;
  width: number;
  height: number;
  fillColor?: string;
  text?: string;
  groupId?: string;
}

export interface SlideTable {
  rows: string[][];
}

// --- Core slide type ---

export interface ParsedSlide {
  index: number;
  title?: string;
  textContent: string;
  classification: SlideClassification;
  hasImages: boolean;
  hasCharts: boolean;
  images?: SlideImage[];
  shapes?: SlideShape[];
  tables?: SlideTable[];
  notes?: string;
}

export interface TransformRequest {
  sourceFormat: SourceFormat;
  storagePath: string;
  requestedOutput: OutputFormat;
  moduleId: string;
  learningObjectives: string[];
}

export interface TransformResult {
  outputFormat: OutputFormat;
  outputPath: string;
  fileSizeBytes: number;
  smeFlags: string[];
  qualityScore: number;
  processingTimeMs: number;
}

export interface TransformPipelineConfig {
  enableFrontendSlides: boolean;
  enableHyperFrames: boolean;
  enableVideoUse: boolean;
  enableRemotion: boolean;
  maxFileSizeMb: number;
}
