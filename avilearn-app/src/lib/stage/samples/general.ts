import type { SlideDeckSpecInput } from '../schema';

/**
 * SAMPLE test deck for the Studio Neutral theme and the General industry pack.
 * It proves that core templates work without the Nav Chart brand.
 * It is not training content: the topic is a placeholder.
 */
const n = (...notes: string[]) => notes.map((speakerNotes) => ({ speakerNotes: `SAMPLE. ${speakerNotes}` }));

export const GENERAL_SAMPLE: SlideDeckSpecInput = {
  specVersion: 'stage/1',
  programme: 'studio-sample',
  course: 'Giving Useful Feedback (SAMPLE)',
  module: { code: 'SAMPLE M2', title: 'A Simple Structure' },
  lesson: { title: 'A Simple Structure', objectives: ['Describe behaviour, not intent'] },
  theme: 'studio-neutral',
  vertical: 'general',
  slides: [
    {
      id: 'title', templateId: 'course-title',
      data: { title: 'Giving Useful Feedback', subtitle: 'SAMPLE test deck for the Studio Neutral theme', dates: 'Test only' },
      steps: n('Theme test. Check the organisation line, fonts and colours.'),
    },
    {
      id: 'objectives', templateId: 'objectives', assertion: 'Course Learning Objectives',
      data: { items: ['Describe what you saw, not intent', 'Link it to one clear effect', 'Agree one next step together'] },
      steps: n('Describe.', 'Link.', 'Agree.', 'Full view.'),
    },
    {
      id: 'ice', templateId: 'icebreaker', assertion: 'Breaking the Ice',
      lowerThird: { name: 'Sam Sample', role: 'SAMPLE trainer' },
      data: { prompts: [{ title: 'Who Are You?', detail: 'Name and team' }, { title: 'Your Role', detail: 'What you do each day' }, { title: 'Recent Feedback', detail: 'One you found useful' }] },
      steps: n('Name and team.', 'Role.', 'Feedback example.', 'Full view.'),
    },
    {
      id: 'day', templateId: 'day-overview', assertion: 'Day 1 Overview',
      data: { modules: [{ code: 'M1', title: 'Why Feedback Fails' }, { code: 'M2', title: 'A Simple Structure' }, { code: 'M3', title: 'Practice in Pairs' }], current: 1 },
      steps: n('Day plan.'),
    },
    {
      id: 'm2', templateId: 'module-opener',
      data: { number: '2', title: 'A Simple Structure', objectives: ['Describe the behaviour you saw', 'State its effect on the work', 'Ask for one change'] },
      steps: n('Module opener with no image: the panel stays empty.'),
    },
    {
      id: 'flow', templateId: 'procedure-flow', eyebrow: 'Structure', assertion: 'Say What You Saw, Then Why It Matters',
      data: { steps: ['Describe the behaviour', 'State the effect', 'Ask a question', 'Agree a next step'] },
      steps: n('Behaviour.', 'Effect.', 'Question.', 'Next step.', 'Full view.'),
    },
    {
      id: 'split', templateId: 'split-contrast', eyebrow: 'Specific', assertion: 'Specific Feedback Is Easier to Act On',
      data: { left: { value: 'Vague', label: 'Good job' }, right: { value: 'Specific', label: 'Clear handover notes' } },
      steps: n('Vague.', 'Specific.'),
    },
    {
      id: 'tl', templateId: 'timeline', eyebrow: 'Timing', assertion: 'Give Feedback Close to the Event',
      data: { pins: [{ at: 'Same day', label: 'Best', key: true }, { at: 'Same week', label: 'Still useful' }, { at: 'Next month', label: 'Detail lost' }, { at: 'Year end', label: 'Too late' }] },
      steps: n('Same day.', 'Same week.', 'Next month.', 'Year end.', 'Full view.'),
    },
    {
      id: 'cards', templateId: 'card-row', eyebrow: 'Delivery', assertion: 'Choose the Right Moment and Place',
      data: {
        cards: [
          { code: '01', title: 'Private', detail: 'Correct one person in private', icon: 'user' },
          { code: '02', title: 'Timely', detail: 'Same shift, not next week', icon: 'clock' },
          { code: '03', title: 'Two-Way', detail: 'Ask for their view first', icon: 'messages-square' },
        ],
      },
      steps: n('SAMPLE. Three conditions for feedback that lands.', 'Correct one person in private, not in front of the team.', 'Give it in the same shift while the detail is fresh.', 'Ask for their view first, then give yours.'),
    },
    {
      id: 'cmp', templateId: 'compare-columns', assertion: 'Describe the Behaviour, Not the Person',
      data: {
        left: { heading: 'Vague', items: ['You were careless today', 'Be more professional'] },
        right: { heading: 'Specific', items: ['You skipped the room check', 'Greet each guest at check-in'] },
      },
      steps: n('SAMPLE. Vague feedback judges the person and gives no next step.', 'Specific feedback names the behaviour and the fix.', 'Ask the group to rewrite one vague line of their own.'),
    },
    {
      id: 'check', templateId: 'checklist', assertion: 'Check Your Message Before You Speak',
      data: { items: ['Based on facts', 'About one behaviour', 'Private setting', 'Ends with a question'] },
      steps: n('Facts.', 'One behaviour.', 'Setting.', 'Question.', 'Full view.'),
    },
    {
      id: 'kc', templateId: 'knowledge-check',
      data: { question: 'Which statement describes behaviour, not intent?', options: ['You did not care', 'You arrived 20 minutes late', 'You are unreliable'], answerIndex: 1 },
      steps: n('Ask the room.', 'Reveal the answer.'),
    },
    {
      id: 'ex', templateId: 'exercise-launch',
      data: { exercise: 'Feedback in Pairs', tool: 'Practice card', task: 'Give one piece of feedback using the structure', minutes: 15, team: true },
      steps: n('Exercise launch. The portal name comes from the theme pack.'),
    },
    {
      id: 'kp', templateId: 'key-points', assertion: 'Module 2 — Key Points',
      data: { lead: 'Specific, timely, two-way', points: [{ title: 'Behaviour First', detail: 'Say what you saw' }, { title: 'Effect Next', detail: 'Say why it matters' }, { title: 'Agree a Step' }] },
      steps: n('Behaviour.', 'Effect.', 'Next step.', 'Close the module.'),
    },
    {
      id: 'brk', templateId: 'break',
      data: { kind: 'Tea Break', ended: 'Module 2', next: { code: 'Module 3', title: 'Practice in Pairs' }, resume: '10:45' },
      steps: n('Break.'),
    },
    {
      id: 'bump', templateId: 'title-bumper',
      data: { title: 'Practice in Pairs', subtitle: 'SAMPLE content for theme testing only' },
      steps: n('Bumper with no ornament in this theme.'),
    },
    {
      id: 'close', templateId: 'day-close',
      data: { day: 'Day 1', title: 'Giving Useful Feedback', covered: [{ code: 'M1', title: 'Why It Fails' }, { code: 'M2', title: 'Structure' }, { code: 'M3', title: 'Practice' }], next: 'Day 2 applies the structure to real cases.' },
      steps: n('Recap.', 'Day 2.'),
    },
    { id: 'q', templateId: 'questions', data: {}, steps: n('Questions.') },
  ],
};
