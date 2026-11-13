import type { SlideDeckSpecInput } from '../schema';
import { GENERAL_SAMPLE } from './general';

/**
 * Sample decks from three different programmes. They prove that every
 * platform template works for more than one course, and they drive the
 * template gallery and the screenshot tests.
 *
 * Structure and voice follow the courses Anthony Houston teaches (reference:
 * IOSA RBI Day 1): course opening, then each module opens with its objectives
 * and closes with "Module N — Key Points" and a break. See docs/VOICE-avilearn.md.
 *
 * Content is illustrative. An SME must check any of it before it is reused
 * in a real course.
 */

const n = (...notes: string[]) => notes.map((speakerNotes) => ({ speakerNotes }));

const KESTREL = 'Kestrel Pacific is a fictional airline.';
const render = (id: string, file: string, alt: string, extra = '') => ({
  id,
  url: `/stage/kestrel/${file}-light.png`,
  urlDark: `/stage/kestrel/${file}-dark.png`,
  kind: 'drawing' as const,
  alt,
  credit: `Kestrel Pacific 3D model, Blender render${extra}. Fictional airline.`,
});
const livery = (id: string, file: string, alt: string, extra = '') => ({
  id,
  url: `/stage/kestrel/${file}-livery.webp`,
  kind: 'drawing' as const,
  alt,
  credit: `Kestrel Pacific 3D model, Blender render${extra}. Fictional airline.`,
});
const photo = (id: string, url: string, alt: string, credit?: string) => ({ id, url, alt, kind: 'photo' as const, credit });
const logo = (id: string, alt: string) => ({ id, url: `/stage/samples/${id}.png`, alt, kind: 'drawing' as const });

/** Shared asset library: Kestrel renders and media, facilitator photo and logos. */
export const assets = [
  livery('a321-34-liv', 'a321-three-quarter', 'Kestrel Pacific A321neo in airline livery, front three-quarter view, gear down'),
  livery('b787-side-liv', 'b787-side', 'Kestrel Pacific 787-9 in airline livery, left side view, gear down', ' (Sketchfab model, CC BY)'),
  livery('a321-top-liv', 'a321-top', 'Kestrel Pacific A321neo, top view, nose to the right'),
  livery('b787-top-liv', 'b787-top', 'Kestrel Pacific 787-9, top view, nose to the right', ' (Sketchfab model, CC BY)'),
  livery('a321-engine-liv', 'a321-engine', 'Kestrel Pacific A321neo, left engine intake and fan, close-up'),
  livery('b787-engine-liv', 'b787-engine', 'Kestrel Pacific 787-9, left engine intake and fan, close-up', ' (Sketchfab model, CC BY)'),
  livery('a321-tail-liv', 'a321-tail', 'Kestrel Pacific A321neo, vertical fin with the kestrel emblem'),
  livery('b787-tail-liv', 'b787-tail', 'Kestrel Pacific 787-9, vertical fin with the kestrel emblem', ' (Sketchfab model, CC BY)'),
  livery('b787-34-liv', 'b787-three-quarter', 'Kestrel Pacific 787-9 in airline livery, front three-quarter view', ' (Sketchfab model, CC BY)'),
  render('a321-34', 'a321-three-quarter', 'Kestrel Pacific A321neo, front three-quarter view, gear down'),
  render('a321-side', 'a321-side', 'Kestrel Pacific A321neo, left side view'),
  render('b787-side', 'b787-side', 'Kestrel Pacific 787-9, left side view, gear down', ' (Sketchfab model, CC BY)'),
  render('b787-34', 'b787-three-quarter', 'Kestrel Pacific 787-9, front three-quarter view', ' (Sketchfab model, CC BY)'),
  photo('fleet', '/stage/kestrel/fleet-apron-sunrise.jpg', 'Kestrel Pacific aircraft on the apron at sunrise', `${KESTREL} AI image, not for technical teaching.`),
  photo('cruise', '/stage/kestrel/787-cruise-cloud.jpg', 'Kestrel Pacific 787 in cruise above cloud', `${KESTREL} AI image, not for technical teaching.`),
  photo('approach', '/stage/kestrel/a321-approach-coast.jpg', 'Kestrel Pacific A321 on approach along a coastline', `${KESTREL} AI image, not for technical teaching.`),
  photo('fac-photo', '/stage/samples/facilitator-aircraft.jpg', 'Military transport aircraft on the ramp'),
  logo('usaf', 'United States Air Force'),
  logo('faa', 'Federal Aviation Administration'),
  logo('iata', 'IATA'),
  logo('nokscoot', 'NokScoot'),
  logo('nok', 'Nok Air'),
  logo('aviation-synergy', 'Aviation Synergy'),
];

export const FAC_DATA = { name: 'Anthony Houston', logos: ['usaf', 'faa', 'iata', 'nokscoot', 'nok', 'aviation-synergy'], photo: 'fac-photo' };

const FACILITATOR = 'Anthony Houston';

export const SMS_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'sms-airlines',
  theme: 'nav-chart',
  vertical: 'aviation',
  course: 'SMS for Airline Managers',
  module: { code: 'SMS D1', title: 'Day 1 — Fundamentals' },
  lesson: { title: 'Day 1 — Fundamentals', objectives: ['Explain the four SMS components', 'Write a hazard statement'] },
  assets,
  slides: [
    {
      id: 'title', templateId: 'course-title',
      data: { title: 'Safety Management Systems', subtitle: 'Practical SMS for Airline Managers', dates: '2–4 March 2027', facilitator: FACILITATOR, image: 'fleet' },
      steps: n('Welcome everyone. Confirm the room, the timings and the breaks before we start.'),
    },
    {
      id: 'objectives', templateId: 'objectives', assertion: 'Course Learning Objectives',
      data: { items: ['Explain the four SMS components', 'Write a clear hazard statement', 'Assess risk with the operator matrix', 'Check that risk controls work'] },
      steps: n(
        'Explain: policy, risk management, assurance and promotion, and how they connect.',
        'Write: one hazard statement format that every department uses.',
        'Assess: likelihood and severity on your own matrix, not a generic one.',
        'Check: evidence that a control works in practice, not only on paper.',
        'These four objectives map to the three days. Ask which one matters most in their department.',
      ),
    },
    {
      id: 'fac', templateId: 'facilitator',
      data: FAC_DATA,
      steps: n('Short introduction. Keep it to one minute and move to the group.'),
    },
    {
      id: 'ice', templateId: 'icebreaker', assertion: 'Breaking the Ice',
      data: {
        prompts: [
          { title: 'Who Are You?', detail: 'Name and department' },
          { title: 'Your Position', detail: 'Role and time in post' },
          { title: 'Your Duties', detail: 'Safety duties' },
          { title: 'Your Experience', detail: 'SMS training to date' },
        ],
      },
      steps: n(
        'Your name and department.',
        'Your current role and how long you have held it.',
        'Your key responsibilities related to safety and quality.',
        'Prior SMS training, or hazard reporting you have handled.',
        'Go round the room. Note who has investigation experience for the group work.',
      ),
    },
    {
      id: 'day1', templateId: 'day-overview', assertion: 'Day 1 Overview — Fundamentals',
      data: { modules: [{ code: 'M0', title: 'Welcome and Course Overview' }, { code: 'M1', title: 'SMS Framework' }, { code: 'M2', title: 'Hazard Identification' }, { code: 'M3', title: 'Safety Risk Assessment' }, { code: 'M4', title: 'Risk Controls' }] },
      steps: n('Walk the day in thirty seconds. Breaks fall after M2 and M3.'),
    },
    {
      id: 'mat', templateId: 'course-materials', assertion: 'Course Materials',
      data: { url: 'portal.avilearn.app/sms', codes: [{ label: 'PIN', value: '2027' }, { label: 'Day 1 Sign-In', value: 'ALPHA' }] },
      steps: n('Scan the code or type the link. Everyone signs in before we move on.'),
    },
    {
      id: 'm2', templateId: 'module-opener',
      data: { number: '2', title: 'Hazard Identification', objectives: ['Explain where hazards come from', 'Write a hazard statement in house format', 'Separate hazards from their consequences'], image: 'approach' },
      steps: n('Module 2. Read the three objectives aloud. We test the third one with a quick check later.'),
    },
    {
      id: 'hero', templateId: 'hero-number', eyebrow: 'ICAO Annex 19', assertion: 'Every SMS Rests on Four Components',
      data: { value: '4', label: 'Components in the ICAO SMS framework' },
      steps: n('Policy and objectives, safety risk management, safety assurance, safety promotion. This module sits inside risk management.'),
    },
    {
      id: 'img', templateId: 'assertion-image', eyebrow: 'Where Hazards Sit', assertion: 'Most Hazards Sit in Normal Daily Work',
      data: { image: 'fleet', caption: 'Several teams work one aircraft at turnaround' },
      steps: n('Most hazards are found in routine work, not only in accidents. Ask: how many teams touch this aircraft in forty minutes?'),
    },
    {
      id: 'quote', templateId: 'quote-reference', eyebrow: 'Standard', assertion: 'Annex 19 Requires a Formal Hazard Process',
      data: { quote: 'The service provider shall develop and maintain a process to identify hazards associated with its aviation products or services.', reference: 'ICAO Annex 19, App. 2, 2.1.1' },
      steps: n('Read the clause aloud. "Develop and maintain" means a living process, not a one-off register.'),
    },
    {
      id: 'cycle', templateId: 'procedure-flow', eyebrow: 'Safety Risk Management', assertion: 'Risk Management Runs as a Continuous Cycle',
      data: { steps: ['Identify hazards', 'Assess risk', 'Apply controls', 'Monitor results'] },
      steps: n('Identify: reports, audits, data.', 'Assess: likelihood and severity.', 'Control: reduce the risk to an acceptable level.', 'Monitor: confirm the controls work, then go round again.', 'Ask where their operator is weakest in this cycle.'),
    },
    {
      id: 'sources', templateId: 'card-row', eyebrow: 'Hazard Sources', assertion: 'Hazards Come From Three Main Sources',
      data: {
        cards: [
          { title: 'Reports', detail: 'Voluntary and mandatory reporting', icon: 'file-text' },
          { title: 'Audits', detail: 'Internal and external findings', icon: 'clipboard-check' },
          { title: 'Data', detail: 'FDM and trend analysis', icon: 'chart-line' },
        ],
      },
      steps: n('Three main sources feed the hazard register.', 'Reports: voluntary and mandatory reporting systems.', 'Audits: internal and external audit findings.', 'Data: flight data monitoring and trend analysis.'),
    },
    {
      id: 'reactive', templateId: 'compare-columns', assertion: 'Find Hazards Before the Event',
      data: {
        left: { heading: 'Reactive', items: ['Investigate after occurrences'], tag: 'Event-driven' },
        right: { heading: 'Proactive and Predictive', items: ['Look at normal operations', 'Watch the trends'], tag: 'Data-driven' },
      },
      steps: n('Reactive methods only start after something has happened.', 'Proactive and predictive methods look at normal operations and trends, before the event.', 'Most mature operators use all three.'),
    },
    {
      id: 'split', templateId: 'split-contrast', eyebrow: 'Hazard or Consequence', assertion: 'Record the Condition, Not the Outcome',
      data: { left: { value: 'Hazard', label: 'Condition that could harm' }, right: { value: 'Outcome', label: 'Result to prevent' } },
      steps: n('A hazard is the condition, for example a contaminated runway.', 'The outcome is what could happen: a runway excursion. Keep them apart in the register.'),
    },
    {
      id: 'kc', templateId: 'knowledge-check',
      data: { question: 'Which is a hazard, not a consequence?', options: ['Runway excursion', 'Contaminated runway', 'Aircraft damage', 'Injury to crew'], answerIndex: 1 },
      steps: n('Give the room twenty seconds. Ask for a show of hands per option.', 'Contaminated runway is the condition. The others are outcomes.'),
    },
    {
      id: 'ex', templateId: 'exercise-launch',
      data: { exercise: 'Build a Risk Profile', tool: 'Risk profile', task: 'Enter three hazards and assess each one with the matrix', minutes: 40, team: true, url: 'portal.avilearn.app' },
      steps: n('Please refer to your Participant Workbook. Teams open the Portal. Walk the room after ten minutes.'),
    },
    {
      id: 'kp', templateId: 'key-points', assertion: 'Module 2 — Key Points',
      data: {
        lead: 'The register starts with clear hazards',
        points: [{ title: 'Conditions, Not Outcomes', detail: 'Hazards describe the condition' }, { title: 'Look at Normal Work', detail: 'Routine tasks hold most hazards' }, { title: 'One House Format' }],
      },
      steps: n(
        'A hazard statement names the condition. The consequence goes in its own column.',
        'Turnarounds, handovers and routine checks produce most of the reports worth reading.',
        'Every department writes hazards the same way, or the register cannot be compared.',
        'Close Module 2 here. The tea break follows.',
      ),
    },
    {
      id: 'brk', templateId: 'break',
      data: { kind: 'Tea Break', ended: 'Module 2', next: { code: 'Module 3', title: 'Safety Risk Assessment' }, resume: '10:45' },
      steps: n('Fifteen minutes. Remind the room of the return time.'),
    },
  ],
};

export const CRM_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'crm-instructor',
  theme: 'nav-chart',
  vertical: 'aviation',
  course: 'CRM Instructor',
  module: { code: 'CRM 02', title: 'Non-Technical Skills' },
  lesson: { title: 'NOTECHS and the Flight Deck', objectives: ['Name the NOTECHS categories'] },
  defaultTheme: 'dark',
  assets,
  slides: [
    { id: 'title', templateId: 'title-bumper', data: { title: 'Non-Technical Skills', subtitle: 'What effective crews do beyond handling skills' }, steps: n('Open with a question: what makes a crew effective, beyond handling skills?') },
    {
      id: 'm2', templateId: 'module-opener',
      data: { number: '2', title: 'NOTECHS and the Flight Deck', objectives: ['Name the four NOTECHS categories', 'Rate observable behaviour, not intent', 'Apply the rating scale consistently'], image: 'cruise' },
      steps: n('Module 2. These three objectives set up the scoring exercise at the end.'),
    },
    { id: 'agenda', templateId: 'agenda', eyebrow: 'Module 2', assertion: 'Module 2 Sessions', data: { items: ['NOTECHS framework', 'Flight deck roles', 'Workload', 'Scoring exercise'] }, steps: n('Walk the four sessions. The scoring exercise closes the module.') },
    { id: 'section', templateId: 'section-divider', data: { number: '2.1', title: 'The NOTECHS Framework' }, steps: n('Section 2.1. The four NOTECHS categories.') },
    {
      id: 'notechs', templateId: 'checklist', eyebrow: 'NOTECHS', assertion: 'Four Categories Cover Non-Technical Skills',
      data: { items: ['Co-operation', 'Leadership', 'Situation awareness', 'Decision making'] },
      steps: n('Co-operation: team building, consideration of others.', 'Leadership and managerial skills.', 'Situation awareness: systems, environment, time.', 'Decision making: define, consider, select, review.', 'These are the headings on the Portal score card.'),
    },
    {
      id: 'deck', templateId: 'annotated-image', eyebrow: 'Walkround', assertion: 'The Walkround Is a Shared Check',
      data: { image: 'a321-34-liv', callouts: [{ x: 83, y: 73, label: 'Flight deck' }, { x: 51, y: 75, label: 'Engine' }, { x: 65, y: 25, label: 'Sharklet' }, { x: 81, y: 86, label: 'Nose gear' }] },
      steps: n(
        'Flight deck: agree who flies and who monitors before engine start.',
        'Engine: report what you find on the walkround to the other pilot.',
        'Sharklet: ground handling damage is easy to miss. Say what you checked.',
        'Nose gear: confirm the tow pin and steering status with the ground crew.',
        'Ask how the captain hears what the first officer found outside. SME to check this walkround content.',
      ),
    },
    {
      id: 'timeline', templateId: 'phase-of-flight', eyebrow: 'Threat and Error Management', assertion: 'Every Phase Has Threats, Most in the Approach',
      data: {
        phases: [
          { value: 'Late load sheet' },
          { value: 'Wind shear' },
          { value: 'Weather deviation' },
          { value: 'Runway change', key: true },
          { value: 'Busy apron' },
        ],
        latent: { label: 'Latent', value: 'Unclear procedures' },
      },
      steps: n(
        'Illustrative threats, one per phase, gate to gate. Pre-departure and taxi: a late load sheet adds time pressure.',
        'Takeoff and climb: wind shear.',
        'Cruise: a weather deviation.',
        'Descent, approach and landing: a late runway change. Most threats arise here.',
        'Taxi and park: a busy apron.',
        'Latent threats affect the whole flight, for example unclear procedures.',
        'Ask each team to name three threats per phase in the Portal exercise.',
      ),
    },
    {
      id: 'chain', templateId: 'cause-chain', eyebrow: 'Example Event', assertion: 'The Fix Belongs at System Level',
      data: { levels: [{ label: 'Symptom', text: 'Altitude deviation' }, { label: 'Direct cause', text: 'Wrong level selected' }, { label: 'Contributing', text: 'Readback not checked' }, { label: 'Root cause', text: 'No cross-check procedure' }], rootIndex: 3 },
      steps: n('Illustrative event. What the crew saw.', 'What the pilot did.', 'What allowed it.', 'What would stop it recurring.', 'Link this back to the monitoring role.'),
    },
    {
      id: 'img', templateId: 'assertion-image', eyebrow: 'Shared Mental Model', assertion: 'Both Pilots Must Fly the Same Plan',
      data: { image: 'b787-34-liv', caption: 'Brief the plan, then monitor against it' },
      steps: n('A shared plan lets the monitoring pilot spot a deviation early.'),
    },
    {
      id: 'kc', templateId: 'knowledge-check',
      data: { question: 'Which NOTECHS category covers planning ahead?', options: ['Co-operation', 'Leadership', 'Situation awareness', 'Decision making'], answerIndex: 2 },
      steps: n('Ask the room. Planning ahead depends on anticipating the next state.', 'Situation awareness includes anticipation.'),
    },
    { id: 'ex', templateId: 'exercise-launch', data: { exercise: 'Score the Debrief', tool: 'NOTECHS score card', task: 'Rate each crew member on the four categories', minutes: 25, team: false }, steps: n('Each participant scores alone. Compare the spread of scores in the debrief.') },
    {
      id: 'kp', templateId: 'key-points', assertion: 'Module 2 — Key Points',
      data: {
        lead: 'Rate what you can see',
        points: [{ title: 'Four Categories', detail: 'Co-operation, leadership, awareness, decisions' }, { title: 'Observable Behaviour', detail: 'Score actions, not intent' }, { title: 'Same Scale, Every Crew' }],
      },
      steps: n('The four headings on every NOTECHS card.', 'Rate what the crew said and did, never what you think they meant.', 'Calibrate as instructors so a 3 means the same thing in every debrief.', 'Close Module 2.'),
    },
    { id: 'q', templateId: 'questions', data: { prompt: 'Which category is hardest to observe?' }, steps: n('Open the floor.') },
    {
      id: 'close', templateId: 'day-close',
      data: { day: 'Day 1', title: 'Crew Resource Management', covered: [{ code: 'M1', title: 'Human Factors' }, { code: 'M2', title: 'Non-Technical Skills' }, { code: 'M3', title: 'Threat and Error' }], next: 'Day 2 applies NOTECHS in full-flight scenarios.' },
      steps: n('Recap the three modules in one sentence each.', 'Thank the group. Day 2 starts with the scenario brief.'),
    },
  ],
};

export const IOSA_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'iosa-auditor',
  theme: 'nav-chart',
  vertical: 'aviation',
  course: 'IOSA Internal Auditor',
  module: { code: 'IOSA D2', title: 'Day 2 — Audit Principles' },
  lesson: { title: 'Day 2 — Audit Principles', objectives: ['Classify a nonconformity'] },
  assets,
  slides: [
    {
      id: 'title', templateId: 'course-title',
      data: { title: 'IOSA Internal Auditor', subtitle: 'Findings, Observations and Root Cause', client: 'Example Airline', dates: '4–6 August 2026', facilitator: FACILITATOR, image: 'cruise' },
      steps: n('Welcome back. Day 2 builds on the fundamentals from yesterday.'),
    },
    {
      id: 'objectives', templateId: 'objectives', assertion: 'Course Learning Objectives',
      data: { items: ['Classify findings and observations', 'Trace root causes to the system', 'Plan and verify corrective action'] },
      steps: n('Classify: the ISM wording decides.', 'Trace: past the person to the process.', 'Plan and verify: closure needs evidence.', 'Today covers all three.'),
    },
    {
      id: 'fac', templateId: 'facilitator',
      data: FAC_DATA,
      steps: n('Short introduction for anyone joining today.'),
    },
    {
      id: 'ice', templateId: 'icebreaker', assertion: 'Breaking the Ice',
      data: {
        prompts: [
          { title: 'Who Are You?', detail: 'Name and department' },
          { title: 'Your Position', detail: 'Role and time in post' },
          { title: 'Audit Experience', detail: 'Audits completed so far' },
          { title: 'Maturity Assessment', detail: 'Used the ISM tool?' },
        ],
      },
      steps: n('Your name and department.', 'Current role and how long you have held it.', 'Internal or IOSA audits you have led or supported.', 'How familiar are you with the ISM Maturity Assessment?', 'Pair experienced auditors with new ones for the workshop.'),
    },
    {
      id: 'day2', templateId: 'day-overview', assertion: 'Day 2 Overview — Audit Principles',
      data: { modules: [{ code: 'M5', title: 'Findings and Observations' }, { code: 'M6', title: 'Root Cause Analysis' }, { code: 'M7', title: 'Corrective Action Plans' }, { code: 'M8', title: 'Closure and Verification' }], current: 0 },
      steps: n('We start with M5. Lunch falls after M6.'),
    },
    {
      id: 'mat', templateId: 'course-materials', assertion: 'Course Materials',
      data: { url: 'portal.avilearn.app/iosa', codes: [{ label: 'PIN', value: '2026' }, { label: 'Day 2 Sign-In', value: 'BRAVO' }] },
      steps: n('Same PIN as yesterday. New sign-in word for Day 2.'),
    },
    {
      id: 'm5', templateId: 'module-opener',
      data: { number: '5', title: 'Findings and Observations', objectives: ['Classify a nonconformity correctly', 'Trace the root cause to the system', 'Plan corrective action that holds'], image: 'fleet' },
      steps: n('Module 5. Read the objectives. The workshop at the end tests all three.'),
    },
    { id: 'agenda', templateId: 'agenda', eyebrow: 'Module 5', assertion: 'Module 5 Sessions', data: { items: ['ISM structure', 'Findings', 'Observations', 'Root cause'] }, steps: n('Walk the sessions in ten seconds.') },
    { id: 'section', templateId: 'section-divider', data: { number: '5.1', title: 'Classify the Nonconformity' }, steps: n('First session: classification.') },
    { id: 'hero', templateId: 'hero-number', eyebrow: 'ISM', assertion: 'The ISM Covers Eight Operational Disciplines', data: { value: '8', label: 'Disciplines, from ORG to SEC' }, steps: n('ORG, FLT, DSP, MNT, CAB, GRH, CGO, SEC.') },
    {
      id: 'split', templateId: 'split-contrast', eyebrow: 'Classification', assertion: 'The Provision Type Sets the Classification',
      data: { left: { value: 'Finding', label: 'Standard not met' }, right: { value: 'Observation', label: 'Recommended practice not met' } },
      steps: n('A finding is a nonconformity with a standard.', 'An observation is a nonconformity with a recommended practice. Check the ISM wording: shall or should.'),
    },
    {
      id: 'chain', templateId: 'cause-chain', eyebrow: 'Levels of Causation', assertion: 'Root Causes Sit in the Management System',
      data: { levels: [{ label: 'Symptom', text: 'Records not signed' }, { label: 'Direct cause', text: 'Form left unsigned' }, { label: 'Contributing', text: 'Workload at shift change' }, { label: 'Root cause', text: 'No completion check' }], rootIndex: 3 },
      steps: n('Start with what the auditor sees.', 'The direct cause.', 'Contributing factors.', 'The root cause: fix this and the problem stops.', 'Why is human error not the root cause here?'),
    },
    {
      id: 'checks', templateId: 'checklist', eyebrow: 'Root Cause Statement', assertion: 'A Root Cause Statement Must Pass Four Checks',
      data: { items: ['Clear and specific', 'Evidence-based', 'System-focused', 'Actionable'] },
      steps: n('Specific enough to act on.', 'Facts, not assumptions.', 'Process, not person.', 'Leads to a corrective action.', 'Use these four checks on the workshop answers.'),
    },
    {
      id: 'flow', templateId: 'procedure-flow', eyebrow: 'Corrective Action', assertion: 'Closing a Finding Follows a Fixed Sequence',
      data: { steps: ['Record the finding', 'Find the root cause', 'Plan the action', 'Implement', 'Verify it works'], highlight: 1 },
      steps: n('Record it with the ISARP reference.', 'Root cause, highlighted: most closures fail here.', 'Plan the action.', 'Implement.', 'Verify: evidence that the action works.', 'Ask which step their organisation skips most often.'),
    },
    {
      id: 'tl', templateId: 'timeline', eyebrow: 'Audit Cycle', assertion: 'A Finding Stays Open After the Audit Ends',
      data: { pins: [{ at: 'Before', label: 'Document review' }, { at: 'On site', label: 'Finding raised', key: true }, { at: 'After', label: 'Corrective action' }, { at: 'Closure', label: 'Evidence accepted' }] },
      steps: n('Before the visit: documents.', 'On site: the finding is raised.', 'After: the operator acts.', 'Closure: evidence is accepted.', 'The audit report is not the end of the finding.'),
    },
    {
      id: 'quote', templateId: 'quote-reference', eyebrow: 'Requirement', assertion: 'Root Cause Analysis Is a Requirement',
      data: { quote: 'The Operator shall have a process for the investigation of findings to determine root cause and corrective action.', reference: 'Paraphrase of IOSA ORG 2.1.7 · check current ISM' },
      steps: n('This is a paraphrase. Show the current ISM text in class.'),
    },
    { id: 'video', templateId: 'title-bumper', data: { title: 'Ramp Audit Walkround', subtitle: 'Watch where the process meets the aircraft' }, steps: n('Short video segment. Ask the group to note every control they see.') },
    {
      id: 'ann', templateId: 'annotated-image', eyebrow: 'Ramp Audit', assertion: 'Audit Where the Process Meets the Aircraft',
      data: { image: 'b787-side-liv', callouts: [{ x: 94, y: 51, label: 'Flight deck' }, { x: 63, y: 62, label: 'Engine' }, { x: 52, y: 74, label: 'Main gear' }, { x: 91, y: 73, label: 'Nose gear' }] },
      steps: n('Flight deck: documents, technical log and checklists.', 'Engine: the walkround record against the maintenance task.', 'Main gear: chocks and cones on arrival.', 'Nose gear: the pushback interface with ground handling.', 'Every callout is a place to collect evidence.'),
    },
    {
      id: 'kp', templateId: 'key-points', assertion: 'Module 5 — Key Points',
      data: {
        lead: 'Classify first, then find why',
        points: [{ title: 'Shall or Should', detail: 'Standard or recommended practice' }, { title: 'System, Not Person', detail: 'Root causes sit in processes' }, { title: 'Verify the Fix' }],
      },
      steps: n('The ISM wording decides the classification.', 'If the root cause names a person, keep asking why.', 'A finding closes on evidence that the action works, not on a signed form.', 'Close Module 5. Lunch follows.'),
    },
    {
      id: 'brk', templateId: 'break',
      data: { kind: 'Lunch Break', ended: 'Module 5', next: { code: 'Module 6', title: 'Root Cause Analysis' }, resume: '13:30' },
      steps: n('Sixty minutes. Afternoon sessions cover root cause analysis and the corrective action workshop.'),
    },
    {
      id: 'close', templateId: 'day-close',
      data: { day: 'Day 2', title: 'Audit Principles', covered: [{ code: 'M5', title: 'Findings' }, { code: 'M6', title: 'Root Cause' }, { code: 'M7', title: 'Corrective Action' }, { code: 'M8', title: 'Closure' }], next: 'Day 3 runs the mock audit and debrief.' },
      steps: n('Recap the four modules.', 'Thank you for today. Day 3 starts with the mock audit brief.'),
    },
    { id: 'q', templateId: 'questions', steps: n('Take questions.'), data: {} },
  ],
};

export const SAMPLE_DECKS: Record<string, SlideDeckSpecInput> = {
  sms: SMS_SAMPLE,
  crm: CRM_SAMPLE,
  iosa: IOSA_SAMPLE,
  general: GENERAL_SAMPLE,
};
