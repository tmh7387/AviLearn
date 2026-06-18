import { generateText } from 'ai';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { QuizQuestion, BloomLevel, SmartObjective } from './types';

/**
 * The Quiz Generator Agent — generates interactive HTML5 quiz slides
 * from slide content and learning objectives.
 *
 * Uses generateText() with a structured response format:
 *   - QUESTIONS_JSON: section with an array of QuizQuestion objects
 *   - ---HTML--- / ---END_HTML--- section with self-contained quiz HTML
 *
 * Aligns quiz difficulty to the requested Bloom's level and flags
 * safety-critical aviation content for SME review.
 */

const SYSTEM_PROMPT = `You are the AviLearn Quiz Generator — an expert assessment designer for aviation e-learning.
You generate interactive HTML5 quiz slides that test learners against specific SMART objectives.

## Output Format

You MUST structure your response EXACTLY as follows:

QUESTIONS_JSON:
\`\`\`json
[
  {
    "questionType": "mcq_single" | "mcq_multi" | "true_false",
    "questionText": "...",
    "options": [
      { "text": "...", "isCorrect": true|false, "feedback": "..." }
    ],
    "correctAnswer": "...",
    "explanation": "...",
    "bloomLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
    "difficulty": 1-5,
    "objectiveIndex": 0
  }
]
\`\`\`

SME_FLAGS:
- [List any safety-critical items that require Subject Matter Expert review, one per line]
- [If none, write "None"]

---HTML---
<!DOCTYPE html>
<html>
...complete self-contained HTML quiz...
</html>
---END_HTML---

## Quiz Design Rules

### Question Quality
1. Each question MUST test the specific action verb in the corresponding objective (e.g., "identify" → recognition task, "analyze" → scenario-based analysis).
2. Align difficulty to the Bloom's level requested:
   - remember/understand → recall, definition, true/false questions
   - apply/analyze → scenario-based, multi-step reasoning
   - evaluate/create → judgment calls, best-practice selection
3. MCQ distractors MUST be plausible but clearly wrong — avoid absurd options.
4. Every option MUST include detailed feedback explaining WHY it is correct or incorrect.
5. Include a mix of question types when generating 3+ questions.
6. For aviation content, reference actual regulations, procedures, or standards where applicable.

### Safety Flagging
- Flag any question touching safety-critical content (emergency procedures, airworthiness, MEL/CDL items, human factors in accident chains) in SME_FLAGS.
- Flag questions where incorrect answers could reinforce dangerous misconceptions.

### HTML Quiz Requirements
The HTML quiz MUST:
1. Use AviLearn dark theme:
   - Background: #14171f
   - Card backgrounds: #1c1f2a
   - Surface accent: #232735
   - Border: #2c3142
   - Accent color: #2dd4bf (brand teal)
   - Text primary: #e6e9f2
   - Text secondary: #a4a9bd
   - Font: 'Inter' from Google Fonts, fallback to system sans-serif
2. Use radio buttons for MCQ single-select, checkboxes for multi-select.
3. Include a Submit button that provides immediate per-question feedback:
   - Green (#22c55e) highlight for correct answers
   - Red (#ef4444) highlight for incorrect answers
   - Show the feedback text for each option
4. Display a final score summary after all questions are answered.
5. Emit xAPI statement on completion:
   window.parent.postMessage({ type: 'xapi', verb: 'completed', score: <0-100>, success: <boolean> }, '*')
6. Be fully self-contained — inline CSS + JS, no external dependencies except Google Fonts.
7. Include a Reset button to restart the quiz.
8. Be responsive (works at 360px+ width) and WCAG AA accessible:
   - Minimum 4.5:1 contrast ratio for text
   - All interactive elements keyboard-navigable with visible focus states
   - Semantic HTML (fieldset/legend for question groups, proper labels)
   - aria-live region for score announcement`;

export interface QuizGeneratorInput {
  currentHtml: string;
  learningObjectives: SmartObjective[];
  bloomLevel?: BloomLevel;
  questionCount?: number;
  moduleTitle: string;
  courseCode: string;
}

export interface QuizGeneratorOutput {
  questions: QuizQuestion[];
  htmlCode: string;
  smeFlags: string[];
}

export async function generateQuiz(input: QuizGeneratorInput): Promise<QuizGeneratorOutput> {
  const elapsed = timer();
  const {
    currentHtml,
    learningObjectives,
    bloomLevel,
    questionCount = 5,
    moduleTitle,
    courseCode,
  } = input;

  const objectivesText = learningObjectives
    .map((obj, i) => `${i + 1}. [${obj.bloom_level.toUpperCase()}] ${obj.text} (Verb: ${obj.action_verb}, Standard: ${obj.standard})`)
    .join('\n');

  const userPrompt = `Generate ${questionCount} quiz question(s) for the following aviation training module:

MODULE: "${moduleTitle}"
COURSE: ${courseCode}
${bloomLevel ? `TARGET BLOOM LEVEL: ${bloomLevel}` : 'Match each question to its objective\'s Bloom level.'}

LEARNING OBJECTIVES:
${objectivesText}

SLIDE CONTENT TO TEST:
\`\`\`html
${currentHtml.slice(0, 8000)}
\`\`\`

Generate the quiz questions (JSON), SME flags, and complete interactive HTML quiz now.`;

  const { text } = await generateText({
    model: getModel('quizGenerator'),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  // Parse QUESTIONS_JSON
  const questions = parseQuestionsJson(text);

  // Parse SME_FLAGS
  const smeFlags = parseSmeFlags(text);

  // Parse HTML
  const htmlCode = parseHtmlSection(text);

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'quiz_generator',
    action: 'generate_quiz',
    inputSummary: `Module: "${moduleTitle}" | ${questionCount} questions | Bloom: ${bloomLevel ?? 'auto'} | ${learningObjectives.length} objectives | Content: ${currentHtml.length} chars`,
    outputSummary: `Generated ${questions.length} questions, ${htmlCode.length} chars HTML, ${smeFlags.length} SME flags`,
    durationMs: ms,
  });

  return { questions, htmlCode, smeFlags };
}

/**
 * Parse the QUESTIONS_JSON section from the AI response.
 */
function parseQuestionsJson(fullText: string): QuizQuestion[] {
  const jsonMatch = fullText.match(/QUESTIONS_JSON:\s*```(?:json)?\s*([\s\S]*?)```/i);
  if (!jsonMatch) {
    console.warn('[QuizGenerator] Could not find QUESTIONS_JSON section in response');
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    if (!Array.isArray(parsed)) {
      console.warn('[QuizGenerator] QUESTIONS_JSON is not an array');
      return [];
    }
    return parsed as QuizQuestion[];
  } catch (err) {
    console.error('[QuizGenerator] Failed to parse QUESTIONS_JSON:', err);
    return [];
  }
}

/**
 * Parse the SME_FLAGS section from the AI response.
 */
function parseSmeFlags(fullText: string): string[] {
  const flagsMatch = fullText.match(/SME_FLAGS:\s*([\s\S]*?)(?=---HTML---|$)/i);
  if (!flagsMatch) return [];

  const lines = flagsMatch[1]
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(line => line.length > 0 && line.toLowerCase() !== 'none');

  return lines;
}

/**
 * Parse the ---HTML--- / ---END_HTML--- section from the AI response.
 */
function parseHtmlSection(fullText: string): string {
  const htmlMatch = fullText.match(/---HTML---\s*([\s\S]*?)\s*---END_HTML---/);
  if (!htmlMatch) {
    console.warn('[QuizGenerator] Could not find ---HTML--- section in response');
    return '';
  }

  let html = htmlMatch[1].trim();
  // Strip markdown code fences if the model wrapped the HTML
  html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return html;
}
