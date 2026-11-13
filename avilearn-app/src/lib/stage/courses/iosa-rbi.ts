import type { SlideDeckSpecInput } from '../schema';
import { assets, FAC_DATA } from '../samples';

/**
 * IOSA Risk-Based Audit (RBI) — Internal Audit and Renewal Readiness.
 * Converted from Anthony Houston's course decks (Day 1 v3.6, Day 2 v3.3,
 * Day 3 v3.2), module by module. Each module is reviewed per slide before the
 * next one is built (guided build). `src` on each slide is the source slide
 * number in the Day PDF.
 *
 * Status: Module 0 — draft for review.
 */

const n = (...notes: string[]) => notes.map((speakerNotes) => ({ speakerNotes }));
const SOURCE = { 1: 'IOSA-RBI-Day1_v3-6.pdf', 2: 'IOSA-RBI-Day2_v3-3.pdf', 3: 'IOSA-RBI-Day3_v3-2.pdf' } as const;
const src = (slide: number, day: 1 | 2 | 3 = 1) => [{ file: SOURCE[day], slide }];

const BASE = {
  specVersion: 'stage/1' as const,
  programme: 'iosa-rbi',
  theme: 'nav-chart',
  vertical: 'aviation',
  course: 'IOSA Risk-Based Audit (RBI)',
  assets,
};

/** Module 0 · Welcome and Course Overview (Day 1, source slides 1–9). */
export const IOSA_RBI_M0: SlideDeckSpecInput = {
  ...BASE,
  module: { code: 'RBI M0', title: 'Welcome and Course Overview' },
  lesson: { title: 'Day 1 — Fundamentals', objectives: ['Know the course, the people and the materials'] },
  slides: [
    {
      id: 'm0-title', templateId: 'course-title', sourceRefs: src(1),
      data: {
        title: 'IOSA Risk-Based Audit (RBI)',
        subtitle: 'Internal Audit and Renewal Readiness',
        client: 'Thai Airways',
        dates: '4–6 August 2026',
        facilitator: 'Anthony Houston',
        image: 'fleet',
      },
      steps: n('Welcome to IOSA Risk-Based Audit: internal audit and renewal readiness training for Thai Airways. Three days, 4 to 6 August.'),
    },
    {
      id: 'm0-objectives', templateId: 'objectives', assertion: 'Course Learning Objectives', sourceRefs: src(2),
      data: {
        items: [
          { text: 'Explain IOSA and RBI principles', icon: 'book-open' },
          { text: 'Link RBI to SMS and assurance', icon: 'link' },
          { text: 'Apply process-based auditing', icon: 'workflow' },
          { text: 'Analyse maturity and plan corrective action', icon: 'gauge' },
        ],
      },
      steps: n(
        'By the end of this 3-day programme, you will be able to do four things. First, explain IOSA and RBI principles. That means you can describe the purpose and principles of IOSA, and of the Risk-Based IOSA framework, in airline operations.',
        'Second, link RBI to SMS and internal assurance. You will connect RBI expectations with your Safety Management System, your internal assurance, and your renewal preparation.',
        'Third, apply process-based auditing. You will apply process-based auditing across airline operational processes, not only check the standards one by one.',
        'Fourth, conduct maturity analysis and plan corrective action. You will run an RBI-oriented gap analysis, prioritise findings by risk, and build corrective action plans.',
        'Day 1 covers the first three. Days 2 and 3 put them into practice.',
      ),
    },
    {
      id: 'm0-fac', templateId: 'facilitator', sourceRefs: src(4),
      data: FAC_DATA,
      steps: n('Introductions. Facilitator: Anthony Houston.'),
    },
    {
      id: 'm0-ice', templateId: 'icebreaker', assertion: 'Breaking the Ice', sourceRefs: src(5),
      data: {
        prompts: [
          { title: 'Who Are You?', detail: 'Name and department' },
          { title: 'Your Position', detail: 'Role and tenure' },
          { title: 'Your Duties', detail: 'Quality, safety, audit' },
          { title: 'Your Experience', detail: 'Prior audit training' },
          { title: 'Maturity Assessment', detail: 'ISM tool familiarity' },
        ],
      },
      steps: n(
        "Before we dive in, let's get to know each other. Your name and your department within Thai Airways.",
        'Your current role, and how long you have held it.',
        'Your key responsibilities related to quality, safety and internal audit.',
        'Prior training, certifications or audit experience relevant to IOSA or RBI.',
        'How familiar are you with the ISM Maturity Assessment?',
        'Note who has used the Maturity Assessment. Mix them across the workshop groups.',
      ),
    },
    {
      id: 'm0-day1', templateId: 'day-overview', assertion: 'Day 1 Overview — Fundamentals', sourceRefs: src(6),
      data: {
        modules: [
          { code: 'M0', title: 'Welcome and Course Overview', icon: 'handshake' },
          { code: 'M1', title: 'Foundations of Risk-Based IOSA', icon: 'layers' },
          { code: 'M2', title: 'RBI, SMS and Internal Assurance', icon: 'shield-check' },
          { code: 'M3', title: 'IOSA Renewal Readiness', icon: 'badge-check' },
          { code: 'M4', title: 'Process-Based Thinking in Audits', icon: 'workflow' },
        ],
        current: 0,
      },
      steps: n(
        'Day 1 is the fundamentals. We start here, with Module 0: the welcome and course overview. Module 1 covers the foundations of Risk-Based IOSA: how RBI differs from traditional IOSA, and why the programme focuses on safety-critical areas. Module 2 links RBI with SMS and internal assurance. Module 3 looks at IOSA renewal readiness. Module 4 closes the day with process-based thinking in audits.',
      ),
    },
    {
      id: 'm0-day2', templateId: 'day-overview', assertion: 'Day 2 Overview — Audit Principles', sourceRefs: src(7),
      data: {
        modules: [
          { code: 'M5', title: 'Internal Audit Principles for RBI', icon: 'clipboard-check' },
          { code: 'M6', title: 'RBI-Oriented Audit Planning and Scoping', icon: 'crosshair' },
          { code: 'M7', title: 'Gap Analysis and Maturity Assessment', icon: 'gauge' },
          { code: 'M8', title: 'Findings, Corrective Action, Follow-Up', icon: 'list-checks' },
        ],
      },
      steps: n(
        'Day 2 is audit principles. Module 5 sets out the internal audit principles for RBI. Module 6 covers RBI-oriented audit planning and scoping. Module 7 is gap analysis and maturity assessment. Module 8 closes the day with findings, corrective action and follow-up.',
      ),
    },
    {
      id: 'm0-day3', templateId: 'day-overview', assertion: 'Day 3 Overview — Simulation and Closeout', sourceRefs: src(8),
      data: {
        modules: [
          { code: 'M9', title: 'Risk Workshop Using Operational Data', icon: 'chart-line' },
          { code: 'M10', title: 'Mock RBI Internal Audit Simulation', icon: 'file-search' },
          { code: 'M11', title: 'Audit Debrief and Finding Development', icon: 'messages-square' },
          { code: 'M12', title: 'Renewal Readiness Action Planning', icon: 'flag' },
        ],
      },
      steps: n(
        'Day 3 is simulation and closeout. Module 9 is a risk workshop that uses operational data. In Module 10 you run a mock RBI internal audit simulation. Module 11 is the audit debrief, where you develop your findings. Module 12 closes the course with your renewal readiness action planning.',
      ),
    },
    {
      id: 'm0-mat', templateId: 'course-materials', assertion: 'Course Materials', sourceRefs: src(9),
      data: { url: 'https://tinyurl.com/y5khm8pv', codes: [{ label: 'PIN', value: '2026' }, { label: 'Day 1 Sign-In', value: 'ALPHA' }] },
      steps: n('Scan the code or type the link. PIN 2026. Day 1 sign-in word: ALPHA.'),
    },
  ],
};

export const IOSA_RBI_MODULES = { 'rbi-m0': IOSA_RBI_M0 };
