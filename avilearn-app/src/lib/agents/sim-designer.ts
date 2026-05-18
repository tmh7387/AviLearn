import { generateText } from 'ai';
import { getModel } from './anthropic-client';
import { logAgentDecision, timer } from './logger';
import type { AgentContext, SimulationType, GeneratedSimulation } from './types';

export async function generateSimulationCode(
  context: AgentContext,
  simType: SimulationType,
  rationale: string
): Promise<GeneratedSimulation> {
  const elapsed = timer();

  const { text } = await generateText({
    model: getModel('simDesigner'),
    system: `You are an expert aviation training simulation developer.
You generate self-contained, interactive HTML5 simulations for aviation e-learning.

CRITICAL RULES:
1. Output ONLY the complete HTML document — no markdown, no code fences, no explanation.
2. The HTML must be fully self-contained: inline CSS and JavaScript, no external dependencies.
3. Include xAPI/cmi5 statement emission via: window.parent.postMessage({ type: 'xapi', verb: 'completed', score: <0-100>, success: <boolean> }, '*')
4. The simulation MUST require active learner interaction — never passive content.
5. Use a dark aviation-themed color scheme: #0a0f1a background, #00e5a0 accent, #ffffff text.
6. Be WCAG AA accessible: keyboard navigable, sufficient contrast, focus indicators.
7. Be responsive: works at 800px+ width.
8. Include a title bar showing the module name and simulation type.
9. Include a completion indicator and score display.
10. Include a "Reset" button to restart the simulation.`,

    prompt: `Generate a "${simType}" simulation for the following aviation training module:

MODULE: "${context.moduleTitle}"
COURSE: ${context.courseCode}
LEARNING OBJECTIVES:
${context.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

PEDAGOGIC RATIONALE: ${rationale}

${context.slideContent ? `CONTENT CONTEXT:\n${context.slideContent.slice(0, 3000)}` : ''}

SIMULATION TYPE GUIDELINES:
${getSimTypeGuidelines(simType)}

Generate the complete, working HTML5 simulation now.`,
  });

  const htmlCode = cleanHtmlOutput(text);

  const ms = elapsed();
  await logAgentDecision({
    agentName: 'sim_designer',
    action: 'generate_simulation_code',
    inputSummary: `Type: ${simType}, Module: ${context.moduleTitle}`,
    outputSummary: `Generated ${htmlCode.length} chars HTML`,
    durationMs: ms,
    relatedModuleId: context.moduleId,
  });

  return {
    simType,
    htmlCode,
    xapiVerb: 'completed',
    learningObjective: context.learningObjectives[0] || context.moduleTitle,
    smeFlags: [],
  };
}

function cleanHtmlOutput(text: string): string {
  let html = text.trim();
  // Strip markdown code fences if present
  if (html.startsWith('```')) {
    html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }
  // Ensure it starts with <!DOCTYPE or <html
  if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
    const docStart = html.indexOf('<!DOCTYPE');
    const htmlStart = html.indexOf('<html');
    const start = docStart >= 0 ? docStart : htmlStart;
    if (start > 0) html = html.slice(start);
  }
  return html;
}

function getSimTypeGuidelines(simType: SimulationType): string {
  const guidelines: Record<SimulationType, string> = {
    'ishikawa-builder': `
- Display a fishbone diagram with a central "Effect/Problem" box on the right
- 6 branch categories: Man, Machine, Method, Material, Measurement, Mother Nature (Environment)
- Provide a pool of draggable cause cards that learner places onto correct branches
- Score based on correct placement percentage
- Show feedback for each placement (correct branch vs wrong branch)
- LAYOUT: The simulation will run inside a full-viewport iframe.
  - Use a CSS grid or flexbox layout that fills 100vh with NO internal scrolling.
  - The cause-card panel (left sidebar) MUST be tall enough to display all 12 cause cards without scrolling — use calc(100vh - 180px) as its height.
  - The fishbone diagram area MUST fill the remaining viewport width and height.`,

    'five-why-chain': `
- Present an initial problem statement
- Provide 5 sequential "Why?" prompts
- Learner types each answer, system evaluates depth and relevance
- Show the chain visually as a vertical flow
- Score based on logical depth and root-cause identification`,

    'decision-tree': `
- Present an aviation scenario (e.g., CRM situation)
- At each node, offer 2-3 choices
- Each choice leads to consequences and next decision point
- Track the path and score based on optimal decisions
- Show debrief at end with correct path highlighted`,

    'step-sequencer': `
- Display a list of procedure steps in randomized order
- Learner drags/reorders steps into the correct sequence
- Provide immediate feedback on correct/incorrect positioning
- Score is percentage of steps in correct position
- Show the correct sequence after completion`,

    'drag-drop-matcher': `
- Display items on one side, categories on the other
- Learner drags items to matching categories
- Provide feedback per match
- Score based on correct matches`,

    'hotspot-diagram': `
- Display a relevant aviation diagram/schematic (use simple SVG)
- Mark clickable hotspot zones on the image
- Learner clicks to identify components or defects
- Show info popup on correct identification
- Score based on found vs total hotspots`,

    'timed-scenario': `
- Present an emergency scenario with a visible countdown timer
- Learner must make decisions within the time limit
- Each decision affects the outcome
- Score penalized for time and incorrect actions
- Show debrief comparing learner actions to correct protocol`,

    'form-validator': `
- Display a realistic aviation form (tech log, release cert, etc.)
- Fields must be filled correctly per regulations
- System validates entries against rules
- Highlight errors with explanations
- Score based on correct field completion`,

    'branching-story': `
- Narrative-driven case study with multiple paths
- Each decision point offers realistic options
- Consequences unfold based on choices
- Multiple endings ranked by quality
- Debrief shows decision points and optimal path`,
  };
  return guidelines[simType] || '';
}
