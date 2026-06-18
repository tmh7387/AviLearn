/**
 * Objective Quality Validator — deterministic SMART criteria validation.
 *
 * Validates learning objectives against instructional design best practices:
 * - Detects banned (non-observable) verbs
 * - Checks for approved action verbs
 * - Identifies SMART components (audience, conditions, standard)
 * - Returns actionable suggestions
 *
 * This is NOT an AI agent — pure TypeScript, no API calls.
 */

// --- Verb lists ---

const BANNED_VERBS = [
  'comprehend', 'grasp', 'know', 'learn', 'discern', 'understand',
  'appreciate', 'be aware', 'be familiar', 'realize', 'be cognizant',
];

const APPROVED_VERBS = [
  'write', 'list', 'explain', 'demonstrate', 'operate', 'sketch',
  'compare', 'construct', 'identify', 'describe', 'apply', 'analyze',
  'evaluate', 'create', 'classify', 'distinguish', 'calculate',
  'assemble', 'design', 'formulate', 'select', 'state', 'define',
  'label', 'name', 'recall', 'recognize', 'interpret', 'summarize',
  'locate', 'perform', 'implement', 'differentiate', 'examine',
  'categorize', 'critique', 'justify', 'assess', 'compose', 'develop',
  'plan', 'produce', 'diagram', 'solve', 'verify', 'troubleshoot',
  'inspect', 'measure', 'calibrate', 'configure', 'install', 'remove',
];

/** Suggested replacements for banned verbs */
const VERB_REPLACEMENTS: Record<string, string[]> = {
  comprehend: ['explain', 'describe', 'summarize', 'interpret'],
  grasp: ['demonstrate', 'apply', 'explain'],
  know: ['identify', 'list', 'state', 'recall', 'name'],
  learn: ['demonstrate', 'perform', 'apply', 'explain'],
  discern: ['distinguish', 'differentiate', 'classify', 'compare'],
  understand: ['explain', 'describe', 'summarize', 'demonstrate'],
  appreciate: ['evaluate', 'justify', 'assess', 'critique'],
  'be aware': ['identify', 'recognize', 'list', 'state'],
  'be familiar': ['recognize', 'identify', 'describe', 'list'],
  realize: ['identify', 'recognize', 'explain', 'state'],
  'be cognizant': ['identify', 'recognize', 'state'],
};

// --- Condition detection patterns ---

const CONDITION_PATTERNS = [
  /\bgiven\b/i,
  /\bwithout\b/i,
  /\busing\b/i,
  /\bprovided with\b/i,
  /\bafter completing\b/i,
  /\bwhen presented with\b/i,
  /\bwith access to\b/i,
  /\bwith the aid of\b/i,
  /\bfrom memory\b/i,
  /\bwithout reference\b/i,
  /\bunder supervision\b/i,
  /\bin a simulated\b/i,
  /\bin a real[-\s]world\b/i,
];

// --- Standard detection patterns ---

const STANDARD_PATTERNS = [
  /\bcorrectly\b/i,
  /\baccurately\b/i,
  /\bon the first attempt\b/i,
  /\bwithin \d+\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/i,
  /\bwith no errors?\b/i,
  /\bwith(?:out)? (?:at least |a minimum of )?\d+\s*%/i,
  /\baccording to\b/i,
  /\bper (?:the |company |regulatory )/i,
  /\bto (?:the )?(?:manufacturer|industry|regulatory) standard/i,
  /\bwith (?:zero|no) (?:defects|deviations|errors|omissions)\b/i,
  /\bsuccessfully\b/i,
  /\bpassing score\b/i,
  /\bscore (?:of |≥ |>= )?\d+/i,
];

// --- Audience detection patterns ---

const AUDIENCE_PATTERNS = [
  { pattern: /\bthe trainee(?:s)?\b/i, label: 'the trainee' },
  { pattern: /\bthe participant(?:s)?\b/i, label: 'the participant' },
  { pattern: /\bparticipants?\b/i, label: 'participants' },
  { pattern: /\bthe learner(?:s)?\b/i, label: 'the learner' },
  { pattern: /\bthe student(?:s)?\b/i, label: 'the student' },
  { pattern: /\btrainees?\b/i, label: 'trainees' },
  { pattern: /\bthe technician(?:s)?\b/i, label: 'the technician' },
  { pattern: /\bthe engineer(?:s)?\b/i, label: 'the engineer' },
  { pattern: /\bthe operator(?:s)?\b/i, label: 'the operator' },
];

// --- Types ---

export type IssueSeverity = 'error' | 'warning';

export type IssueType =
  | 'banned_verb'
  | 'missing_action_verb'
  | 'missing_conditions'
  | 'missing_standard'
  | 'missing_audience'
  | 'too_vague'
  | 'not_observable';

export interface ObjectiveIssue {
  type: IssueType;
  message: string;
  severity: IssueSeverity;
  suggestion?: string;
}

export interface ObjectiveValidation {
  isValid: boolean;
  issues: ObjectiveIssue[];
  suggestions: string[];
  smartScore: {
    specific: boolean;
    measurable: boolean;
    actionOriented: boolean;
    reasonable: boolean;
    timeBound: boolean;
  };
  detectedComponents: {
    audience?: string;
    actionVerb?: string;
    conditions?: string;
    standard?: string;
  };
}

// --- Core validation ---

/**
 * Validates a learning objective against SMART criteria and
 * instructional design best practices. Pure function, no side effects.
 */
export function validateObjective(text: string): ObjectiveValidation {
  const issues: ObjectiveIssue[] = [];
  const suggestions: string[] = [];
  const normalized = text.toLowerCase().trim();

  // Skip validation for very short text
  if (normalized.length < 10) {
    return {
      isValid: false,
      issues: [{ type: 'too_vague', message: 'Objective is too short to evaluate', severity: 'warning' }],
      suggestions: ['Write a complete objective with at least 15-20 words'],
      smartScore: { specific: false, measurable: false, actionOriented: false, reasonable: false, timeBound: false },
      detectedComponents: {},
    };
  }

  // --- Check for banned verbs ---
  const foundBanned: string[] = [];
  for (const verb of BANNED_VERBS) {
    const regex = new RegExp(`\\b${verb.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(normalized)) {
      foundBanned.push(verb);
      const replacements = VERB_REPLACEMENTS[verb] || ['demonstrate', 'explain', 'identify'];
      issues.push({
        type: 'banned_verb',
        message: `Non-observable verb: "${verb}" — cannot be measured or assessed`,
        severity: 'error',
        suggestion: `Replace with: ${replacements.join(', ')}`,
      });
    }
  }

  // --- Detect approved action verb ---
  let detectedVerb: string | undefined;
  for (const verb of APPROVED_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(normalized)) {
      detectedVerb = verb;
      break;
    }
  }
  if (!detectedVerb && foundBanned.length === 0) {
    issues.push({
      type: 'missing_action_verb',
      message: 'No observable action verb detected',
      severity: 'warning',
      suggestion: 'Start with a verb like: identify, explain, demonstrate, list, compare, construct',
    });
  }

  // --- Detect audience ---
  let detectedAudience: string | undefined;
  for (const { pattern, label } of AUDIENCE_PATTERNS) {
    if (pattern.test(text)) {
      detectedAudience = label;
      break;
    }
  }
  if (!detectedAudience) {
    issues.push({
      type: 'missing_audience',
      message: 'No target audience specified',
      severity: 'warning',
      suggestion: 'Add the intended audience, e.g. "the trainee will be able to..."',
    });
  }

  // --- Detect conditions ---
  let detectedConditions: string | undefined;
  for (const pattern of CONDITION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Extract a snippet around the match
      const idx = match.index ?? 0;
      detectedConditions = text.substring(idx, Math.min(idx + 60, text.length)).trim();
      break;
    }
  }
  if (!detectedConditions) {
    issues.push({
      type: 'missing_conditions',
      message: 'No conditions specified for when/how performance occurs',
      severity: 'warning',
      suggestion: 'Add conditions, e.g. "Given a reference manual, ..." or "Without external aids, ..."',
    });
  }

  // --- Detect standard ---
  let detectedStandard: string | undefined;
  for (const pattern of STANDARD_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedStandard = match[0].trim();
      break;
    }
  }
  if (!detectedStandard) {
    issues.push({
      type: 'missing_standard',
      message: 'No performance standard specified',
      severity: 'warning',
      suggestion: 'Add a standard, e.g. "...correctly on the first attempt" or "...with at least 80% accuracy"',
    });
  }

  // --- Calculate SMART score ---
  const smartScore = {
    specific: !!detectedVerb && normalized.length >= 20,
    measurable: !!detectedVerb && foundBanned.length === 0,
    actionOriented: !!detectedVerb,
    reasonable: normalized.length >= 15 && normalized.length <= 500,
    timeBound: !!detectedStandard,
  };

  // --- Build suggestions ---
  if (issues.length === 0) {
    suggestions.push('This objective meets all SMART criteria ✓');
  } else {
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    if (warningCount > 0 && foundBanned.length === 0) {
      suggestions.push(
        `Suggested format: "Given [conditions], ${detectedAudience || 'the trainee'} will be able to [action verb] [specific task] [standard of performance]"`,
      );
    }
  }

  return {
    isValid: foundBanned.length === 0,
    issues,
    suggestions,
    smartScore,
    detectedComponents: {
      audience: detectedAudience,
      actionVerb: detectedVerb,
      conditions: detectedConditions,
      standard: detectedStandard,
    },
  };
}

/**
 * Returns the list of approved observable action verbs,
 * useful for rendering verb picker UI.
 */
export function getApprovedVerbs(): string[] {
  return [...APPROVED_VERBS];
}

/**
 * Returns the list of banned non-observable verbs,
 * useful for rendering warnings.
 */
export function getBannedVerbs(): string[] {
  return [...BANNED_VERBS];
}
