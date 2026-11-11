import type { SlideDeckSpecInput } from '../schema';
import { SAMPLE_AIRCRAFT, SAMPLE_FLIGHT_DECK } from './assets';

/**
 * Sample decks from three different programmes. They prove that every
 * platform template works for more than one course, and they drive the
 * template gallery and the screenshot tests.
 *
 * Content is illustrative. An SME must check any of it before it is reused
 * in a real course.
 */

const n = (...notes: string[]) => notes.map((speakerNotes) => ({ speakerNotes }));

const assets = [
  { id: 'aircraft', url: SAMPLE_AIRCRAFT, alt: 'Line drawing of a transport aircraft in side view', lineArt: true },
  { id: 'flight-deck', url: SAMPLE_FLIGHT_DECK, alt: 'Plan of a two-pilot flight deck with seats and centre pedestal', lineArt: true },
];

export const SMS_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'sms-airlines',
  course: 'SMS for Airlines',
  module: { code: 'SMS 03', title: 'Safety risk management' },
  lesson: { title: 'Safety risk management', objectives: ['Explain the four SMS components', 'Apply the risk management cycle'] },
  assets,
  slides: [
    { id: 'title', templateId: 'title-bumper', data: { title: 'Safety risk management', subtitle: 'From hazard to control, and back again' }, steps: n('Welcome. This module covers how an operator finds hazards and controls risk.') },
    { id: 'agenda', templateId: 'agenda', eyebrow: 'Today', assertion: 'Five parts, one risk cycle', data: { items: ['SMS framework', 'Hazard identification', 'Risk assessment', 'Risk controls', 'Exercise'], current: 1 }, steps: n('We are on part two. Point at the highlighted row.') },
    {
      id: 'objectives', templateId: 'objectives', eyebrow: 'Objectives', assertion: 'By the end you can run one risk cycle',
      data: { items: ['Name the four SMS components', 'Write a hazard statement', 'Assess risk with the matrix'] },
      steps: n('First objective: name the four components from ICAO Annex 19.', 'Second: write a hazard statement in the house format.', 'Third: use the 5x5 matrix.', 'Full view. Ask which objective feels hardest.'),
    },
    { id: 'hero', templateId: 'hero-number', eyebrow: 'ICAO Annex 19', assertion: 'Every SMS rests on four components', data: { value: '4', label: 'Components in the ICAO SMS framework' }, steps: n('Policy and objectives, risk management, assurance, promotion. The next slides take risk management.') },
    { id: 'img', templateId: 'assertion-image', eyebrow: 'Where hazards hide', assertion: 'Hazards sit in normal daily work', data: { image: 'aircraft', caption: 'Turnaround: many teams, one aircraft, little time' }, steps: n('Most hazards are found in routine work, not only in accidents.') },
    { id: 'quote', templateId: 'quote-reference', eyebrow: 'Standard', assertion: 'The standard asks for a formal process', data: { quote: 'The service provider shall develop and maintain a process to identify hazards associated with its aviation products or services.', reference: 'ICAO Annex 19, App. 2, 2.1.1' }, steps: n('Read the clause aloud. Note "develop and maintain": it is a living process, not a one-off.') },
    {
      id: 'cycle', templateId: 'procedure-flow', eyebrow: 'Risk management cycle', assertion: 'Risk management is a loop, not a form',
      data: { steps: ['Identify hazards', 'Assess risk', 'Apply controls', 'Monitor results'] },
      steps: n('Identify: reports, audits, data.', 'Assess: likelihood and severity.', 'Control: reduce to an acceptable level.', 'Monitor: check the controls work, then go round again.', 'Full view. Ask where their operator is weakest.'),
    },
    { id: 'split', templateId: 'split-contrast', eyebrow: 'Hazard or consequence', assertion: 'Name the condition, not the outcome', data: { left: { value: 'Hazard', label: 'Condition that could harm' }, right: { value: 'Outcome', label: 'Result to prevent' } }, steps: n('A hazard is the condition, for example contaminated runway.', 'The consequence is what could happen: runway excursion. Keep them apart in the register.') },
    {
      id: 'kc', templateId: 'knowledge-check', data: { question: 'Which is a hazard, not a consequence?', options: ['Runway excursion', 'Contaminated runway', 'Aircraft damage', 'Injury to crew'], answerIndex: 1 },
      steps: n('Give the room 20 seconds. Ask for a show of hands per option.', 'Contaminated runway is the condition. The others are outcomes.'),
    },
    { id: 'ex', templateId: 'exercise-launch', data: { exercise: 'Build a risk profile', tool: 'Risk profile', task: 'Enter three hazards and assess each one with the matrix', minutes: 40, team: true, url: 'portal.avilearn.app' }, steps: n('Teams open the Portal. Walk the room after 10 minutes.') },
    {
      id: 'summary', templateId: 'summary', eyebrow: 'Summary', assertion: 'Three things to take back',
      data: { items: ['Hazards are conditions', 'Risk is likelihood and severity', 'Controls need monitoring'] },
      steps: n('One.', 'Two.', 'Three.', 'Full view. Close the module.'),
    },
  ],
};

export const CRM_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'crm-instructor',
  course: 'CRM Instructor',
  module: { code: 'CRM 02', title: 'Non-technical skills' },
  lesson: { title: 'NOTECHS and the flight deck', objectives: ['Name the NOTECHS categories'] },
  defaultTheme: 'dark',
  assets,
  slides: [
    { id: 'title', templateId: 'title-bumper', data: { title: 'Non-technical skills', subtitle: 'What good crews do that checklists cannot' }, steps: n('Open with a question: what makes a crew good, beyond handling skills?') },
    { id: 'section', templateId: 'section-divider', data: { number: '02', title: 'The NOTECHS framework' }, steps: n('Section two. We look at the four NOTECHS categories.') },
    {
      id: 'objectives', templateId: 'objectives', eyebrow: 'Objectives', assertion: 'By the end you can score crew behaviour',
      data: { items: ['Name the NOTECHS categories', 'Spot observable behaviour', 'Give a fair rating'] },
      steps: n('Name the four categories.', 'Rate what you can see and hear, not what you guess.', 'Use the rating scale the same way for each crew.', 'Full view.'),
    },
    {
      id: 'notechs', templateId: 'checklist', eyebrow: 'NOTECHS', assertion: 'Four categories cover the non-technical skills',
      data: { items: ['Co-operation', 'Leadership', 'Situation awareness', 'Decision making'] },
      steps: n('Co-operation: team building, consideration of others.', 'Leadership and managerial skills.', 'Situation awareness: systems, environment, time.', 'Decision making: define, consider, select, review.', 'Full view. These are the headings on the Portal score card.'),
    },
    {
      id: 'deck', templateId: 'annotated-image', eyebrow: 'Flight deck', assertion: 'Roles are set before the engines start',
      data: { image: 'flight-deck', callouts: [{ x: 25, y: 35, label: 'Pilot flying' }, { x: 75, y: 35, label: 'Pilot monitoring' }, { x: 50, y: 72, label: 'Shared controls' }] },
      steps: n('Left seat in this example is pilot flying.', 'Right seat monitors and calls deviations.', 'The pedestal is shared: call and confirm before you move a lever.', 'Full view. Ask how roles change after a handover of control.'),
    },
    {
      id: 'timeline', templateId: 'flight-timeline', eyebrow: 'Workload', assertion: 'Workload peaks at the ends of the flight',
      data: { pins: [{ at: 'Pre-flight', label: 'Briefing' }, { at: 'Takeoff', label: 'High workload', key: true }, { at: 'Cruise', label: 'Low workload' }, { at: 'Approach', label: 'High workload', key: true }, { at: 'Taxi in', label: 'Fatigue risk' }] },
      steps: n('Start at the briefing.', 'Takeoff: high workload.', 'Cruise: low workload, watch for complacency.', 'Approach and landing: high workload again.', 'Taxi in: fatigue risk.', 'Full view. Plan the briefing around the two peaks.'),
    },
    {
      id: 'chain', templateId: 'cause-chain', eyebrow: 'Example event', assertion: 'The fix belongs at the system level',
      data: { levels: [{ label: 'Symptom', text: 'Altitude deviation' }, { label: 'Direct cause', text: 'Wrong level selected' }, { label: 'Contributing', text: 'Readback not checked' }, { label: 'Root cause', text: 'No cross-check procedure' }], rootIndex: 3 },
      steps: n('Illustrative event. What the crew saw.', 'What the pilot did.', 'What allowed it.', 'What would stop it recurring.', 'Full view. Link back to the monitoring role.'),
    },
    { id: 'hero', templateId: 'assertion-image', eyebrow: 'Shared mental model', assertion: 'Both pilots must fly the same plan', data: { image: 'aircraft', caption: 'One aircraft, one plan, two heads' }, steps: n('A shared plan lets the monitoring pilot spot a deviation early.') },
    {
      id: 'kc', templateId: 'knowledge-check', data: { question: 'Which NOTECHS category covers planning ahead?', options: ['Co-operation', 'Leadership', 'Situation awareness', 'Decision making'], answerIndex: 2 },
      steps: n('Ask the room. Planning ahead depends on anticipating the next state.', 'Situation awareness includes anticipation.'),
    },
    { id: 'ex', templateId: 'exercise-launch', data: { exercise: 'Score the debrief', tool: 'NOTECHS score card', task: 'Rate each crew member on the four categories', minutes: 25, team: false }, steps: n('Each participant scores alone. Compare spreads in the debrief.') },
    { id: 'q', templateId: 'questions', data: { prompt: 'Which category is hardest to observe?' }, steps: n('Open the floor.') },
  ],
};

export const IOSA_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'iosa-auditor',
  course: 'IOSA Auditor',
  module: { code: 'IOSA 05', title: 'Findings and observations' },
  lesson: { title: 'Findings, observations and root cause', objectives: ['Classify a nonconformity'] },
  assets,
  slides: [
    { id: 'title', templateId: 'title-bumper', data: { title: 'Findings and observations', subtitle: 'Classify what you see, then find why it happened' }, steps: n('Open the module. Remind the class of the audit scope.') },
    { id: 'agenda', templateId: 'agenda', eyebrow: 'Module 5', assertion: 'Four parts in this module', data: { items: ['ISM structure', 'Findings', 'Observations', 'Root cause'] }, steps: n('Walk the agenda in ten seconds.') },
    { id: 'section', templateId: 'section-divider', data: { number: '5.1', title: 'Classify the nonconformity' }, steps: n('First part: classification.') },
    { id: 'hero', templateId: 'hero-number', eyebrow: 'ISM', assertion: 'The ISM covers eight operational disciplines', data: { value: '8', label: 'Disciplines, from ORG to SEC' }, steps: n('ORG, FLT, DSP, MNT, CAB, GRH, CGO, SEC.') },
    { id: 'split', templateId: 'split-contrast', eyebrow: 'Classification', assertion: 'The provision type sets the classification', data: { left: { value: 'Finding', label: 'Standard not met' }, right: { value: 'Observation', label: 'Recommended practice not met' } }, steps: n('A finding is a nonconformity with a standard.', 'An observation is a nonconformity with a recommended practice. Check the ISM wording: shall or should.') },
    {
      id: 'chain', templateId: 'cause-chain', eyebrow: 'Levels of causation', assertion: 'Root causes sit in the management system',
      data: { levels: [{ label: 'Symptom', text: 'Records not signed' }, { label: 'Direct cause', text: 'Form left unsigned' }, { label: 'Contributing', text: 'Workload at shift change' }, { label: 'Root cause', text: 'No completion check' }], rootIndex: 3 },
      steps: n('Start with what the auditor sees.', 'The direct cause.', 'Contributing factors.', 'The root cause: fix this and the problem stops.', 'Full view. Why is human error not the root cause here?'),
    },
    {
      id: 'checks', templateId: 'checklist', eyebrow: 'Root cause statement', assertion: 'A good root cause statement passes four checks',
      data: { items: ['Clear and specific', 'Evidence-based', 'System-focused', 'Actionable'] },
      steps: n('Specific enough to act on.', 'Facts, not assumptions.', 'Process, not person.', 'Leads to a corrective action.', 'Full view. Use these on the exercise answers.'),
    },
    {
      id: 'flow', templateId: 'procedure-flow', eyebrow: 'Corrective action', assertion: 'Close a finding in five moves',
      data: { steps: ['Record the finding', 'Find the root cause', 'Plan the action', 'Implement', 'Verify it works'], highlight: 1 },
      steps: n('Record with the ISARP reference.', 'Root cause, highlighted: most closures fail here.', 'Plan the action.', 'Implement.', 'Verify: evidence that the action works.', 'Full view.'),
    },
    {
      id: 'tl', templateId: 'flight-timeline', eyebrow: 'Audit cycle', assertion: 'A finding lives on after the audit ends',
      data: { pins: [{ at: 'Before', label: 'Document review' }, { at: 'On site', label: 'Finding raised', key: true }, { at: 'After', label: 'Corrective action' }, { at: 'Closure', label: 'Evidence accepted' }] },
      steps: n('Before the visit: documents.', 'On site: the finding is raised.', 'After: the operator acts.', 'Closure: evidence is accepted.', 'Full view.'),
    },
    { id: 'quote', templateId: 'quote-reference', eyebrow: 'Requirement', assertion: 'Root cause analysis is required, not optional', data: { quote: 'The Operator shall have a process for the investigation of findings to determine root cause and corrective action.', reference: 'Paraphrase of IOSA ORG 2.1.7 · check current ISM' }, steps: n('This is a paraphrase. Show the current ISM text in class.') },
    {
      id: 'ann', templateId: 'annotated-image', eyebrow: 'Ramp audit', assertion: 'Look where the process meets the aircraft',
      data: { image: 'aircraft', callouts: [{ x: 13, y: 52, label: 'Flight deck' }, { x: 43, y: 54, label: 'Cargo loading' }, { x: 88, y: 50, label: 'Tail number' }] },
      steps: n('Flight deck: documents and checklists.', 'Cargo: load sheet against the actual load.', 'Tail number: match it to the records.', 'Full view.'),
    },
    {
      id: 'summary', templateId: 'summary', eyebrow: 'Summary', assertion: 'Classify, analyse, verify',
      data: { items: ['Shall means finding', 'Should means observation', 'Root cause before action'] },
      steps: n('One.', 'Two.', 'Three.', 'Full view.'),
    },
    { id: 'q', templateId: 'questions', steps: n('Take questions.'), data: {} },
  ],
};

export const SAMPLE_DECKS: Record<string, SlideDeckSpecInput> = {
  sms: SMS_SAMPLE,
  crm: CRM_SAMPLE,
  iosa: IOSA_SAMPLE,
};
