import type { SlideDeckSpecInput } from '../schema';
import { assets, FAC_DATA } from '../samples';

/**
 * IOSA Risk-Based Audit (RBI) — Internal Audit and Renewal Readiness.
 * Converted from Anthony Houston's course decks (Day 1 v3.6, Day 2 v3.3,
 * Day 3 v3.2), module by module. Each module is reviewed per slide before the
 * next one is built (guided build). `src` on each slide is the source slide
 * number in the Day PDF.
 *
 * Status: Module 0 approved (13 Nov 2026). Module 1 approved. Module 2 — draft for review.
 */

const n = (...notes: string[]) => notes.map((speakerNotes) => ({ speakerNotes }));
const SOURCE = { 1: 'IOSA-RBI-Day1_v3-6.pdf', 2: 'IOSA-RBI-Day2_v3-3.pdf', 3: 'IOSA-RBI-Day3_v3-2.pdf' } as const;
const src = (slide: number, day: 1 | 2 | 3 = 1) => [{ file: SOURCE[day], slide }];

/**
 * Image credits (Anthony, 13 Nov 2026): no per-slide credit lines. The title
 * slide says once that Kestrel Pacific is the airline simulation that supports
 * the course workshops. Keep the CC BY credit if a 787-9 render is ever used.
 */
const KESTREL_NOTE = 'Kestrel Pacific is the airline simulation that supports the course workshops.';
const COURSE_ASSETS = assets.map((a) => ({ ...a, credit: a.id === 'fleet' ? KESTREL_NOTE : a.id.startsWith('b787') && 'credit' in a ? a.credit : undefined }));

const BASE = {
  specVersion: 'stage/1' as const,
  programme: 'iosa-rbi',
  theme: 'nav-chart',
  vertical: 'aviation',
  course: 'IOSA Risk-Based Audit (RBI)',
  assets: COURSE_ASSETS,
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
      steps: n('Welcome to IOSA Risk-Based Audit: internal audit and renewal readiness training for Thai Airways. Three days, 4 to 6 August. The aircraft you see in this course belong to Kestrel Pacific, the airline simulation that supports our workshops.'),
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

/** Module 1 · Foundations of Risk-Based IOSA (Day 1, source slides 10–26; the PDF has no slide 24). */
export const IOSA_RBI_M1: SlideDeckSpecInput = {
  ...BASE,
  module: { code: 'RBI M1', title: 'Foundations of Risk-Based IOSA' },
  lesson: { title: 'Day 1 — Fundamentals', objectives: ['Explain how RBI differs from traditional IOSA'] },
  slides: [
    {
      id: 'm1-open', templateId: 'module-opener', sourceRefs: src(10),
      data: {
        number: '1',
        title: 'Foundations of Risk-Based IOSA',
        objectives: ['Explain how RBI differs from traditional IOSA', 'Describe why we focus on safety-critical areas'],
        image: 'a321-side',
      },
      steps: n('Module 1: Foundations of Risk-Based IOSA. By the end of this module you will be able to explain how RBI differs from traditional IOSA, and describe why the programme focuses on safety-critical areas.'),
    },
    {
      id: 'm1-iso', templateId: 'card-row', assertion: 'ISO Standards Foundation', sourceRefs: src(11),
      data: {
        cards: [
          { code: 'ISO 9001:2015', title: 'Risk-Based Thinking', detail: 'Plan actions for risks', icon: 'lightbulb' },
          { code: 'ISO 19011:2018', title: 'Risk Drives Auditing', detail: 'Planning, sampling and depth', icon: 'clipboard-check' },
          { code: 'New Concept', title: 'One Unified Framework', detail: 'Risk across the audit lifecycle', icon: 'layers' },
        ],
      },
      steps: n(
        'Two ISO standards set the foundation, and a new concept that joins them.',
        'ISO 9001:2015 introduces risk-based thinking. Organisations must identify risks and opportunities, and plan actions to address them.',
        'ISO 19011:2018 sets the standards for auditing management systems. Risk should drive audit planning, sampling decisions, and the depth of examination during audits.',
        'Together they give a new concept: a unified framework. Risk-awareness is embedded throughout the audit lifecycle, from programme design to final reporting.',
      ),
    },
    {
      id: 'm1-iso-q', templateId: 'quote-reference', eyebrow: 'ISO Standards Foundation', assertion: 'ISO 19011:2018', sourceRefs: src(11),
      data: { quote: 'The concept of risk should substantively influence the planning, execution and reporting of audits.', reference: 'ISO 19011:2018' },
      steps: n('ISO 19011 says it plainly: "The concept of risk should substantively influence the planning, execution and reporting of audits." Planning, execution and reporting. Not just planning.'),
    },
    {
      id: 'm1-annex', templateId: 'card-row', assertion: 'Risk-Based Thinking — Annex A.4', sourceRefs: src(12),
      data: {
        cards: [
          { title: 'Context and Planning', detail: 'Risks are the basis for planning', icon: 'compass' },
          { title: 'Prevention as a System Property', detail: 'No separate preventive action clause', icon: 'shield-check' },
          { title: 'Performance Over Prescription', icon: 'gauge' },
        ],
      },
      steps: n(
        'Annex A.4 of ISO 9001:2015 clarifies the intent behind risk-based thinking, and how it applies throughout the quality management system. Three points.',
        'Context and planning. The organisation must understand its context and determine its risks as a basis for planning.',
        'Prevention as a system property. The QMS itself acts as a preventive tool. There is no separate "preventive action" clause.',
        'Performance over prescription. Risk-based thinking has enabled a shift from prescriptive requirements to performance-based requirements.',
      ),
    },
    {
      id: 'm1-prop', templateId: 'quote-reference', eyebrow: 'Risk Application', assertion: 'Proportionality', sourceRefs: src(13),
      data: {
        quote: 'Not all processes of a quality management system represent the same level of risk in terms of the organization’s ability to meet its objectives.',
        reference: 'ISO 9001:2015, Annex A.4',
      },
      steps: n('Risk application starts with proportionality. Not all processes of a quality management system represent the same level of risk in terms of the organisation\'s ability to meet its objectives. So the effort we apply should not be the same either.'),
    },
    {
      id: 'm1-resp', templateId: 'card-row', eyebrow: 'Risk Application', assertion: 'Organizational Responsibility — Clause 6.1', sourceRefs: src(13),
      data: {
        cards: [
          { title: 'Actions to Address Risk', detail: 'And whether to keep documented evidence', icon: 'file-text' },
          { title: 'Accountability', detail: 'Management and internal audit functions', icon: 'users' },
        ],
      },
      steps: n(
        'Under Clause 6.1, the organisation is responsible for its own application of risk-based thinking.',
        'That includes the actions taken to address risk, and the decision whether to retain documented evidence of its risk determinations.',
        'This places accountability squarely with management and with the internal audit functions. That means you.',
      ),
    },
    {
      id: 'm1-why', templateId: 'card-row', assertion: 'Why Risk Must Drive Audits', sourceRefs: src(14),
      data: {
        cards: [
          { title: 'Focus on Significance', detail: 'Where failure has the greatest impact', icon: 'crosshair' },
          { title: 'Greater Audit Value', detail: 'When the audit addresses high-risk issues', icon: 'trending-up' },
        ],
      },
      steps: n(
        'Remember the ISO 19011 line: risk should shape the planning, execution and reporting of audits. Here are two reasons why.',
        'Focus on significance. Rather than mechanically checking every box, auditors direct their attention to the areas where failures would have the greatest operational or safety impact.',
        'Greater audit value. The value of the audit increases substantially when the process addresses high-risk issues.',
      ),
    },
    {
      id: 'm1-life', templateId: 'card-row', assertion: 'Risk Across the Audit Lifecycle', sourceRefs: src(15),
      data: {
        cards: [
          { code: '01', title: 'Planning', detail: 'Plan and checklist are risk-calibrated', icon: 'list-checks' },
          { code: '02', title: 'Execution', detail: 'Sampling proportionate to risk exposure', icon: 'search' },
          { code: '03', title: 'Reporting', detail: 'Findings risk-rated and prioritised', icon: 'flag' },
        ],
      },
      steps: n(
        'Risk-based thinking must be applied consistently at every stage of the audit, not just at planning.',
        'Planning. The audit plan and the audit checklist are risk-calibrated.',
        'Execution. Data collection and sampling strategies are proportionate to the risk exposure.',
        'Reporting. Findings are risk-rated and prioritised. Follow-up plans are structured around the operational significance of each finding.',
      ),
    },
    {
      id: 'm1-purp1', templateId: 'card-row', eyebrow: 'Purpose of Risk-Based Auditing', assertion: 'System Maturity and ICAO Compliance', sourceRefs: src(16),
      data: {
        cards: [
          { title: 'Assess System Maturity', detail: 'How effective the management system is', icon: 'gauge' },
          { title: 'ICAO Annex 19', detail: 'Element 3.3, SSP framework', icon: 'scale' },
          { title: 'Hazards, Risks, Mitigation', detail: 'Identify, measure, show it works', icon: 'shield-check' },
        ],
      },
      steps: n(
        'What is risk-based auditing for? First: system maturity and ICAO compliance.',
        'It assesses the effectiveness and the maturity of the organisation\'s management system.',
        'It complies with Element 3.3 of the ICAO Annex 19 SSP framework.',
        'And it gives a mechanism to better identify hazards, measure the associated risks, and demonstrate effective mitigation of those risks.',
      ),
    },
    {
      id: 'm1-purp2', templateId: 'card-row', eyebrow: 'Purpose of Risk-Based Auditing', assertion: 'Safety and Efficiency', sourceRefs: src(17),
      data: {
        cards: [
          { title: 'Preserve Aviation Safety', detail: 'Oversight on the most consequential risks', icon: 'shield-check' },
          { title: 'Optimise Oversight Resources', detail: 'More effective use of resources', icon: 'scale' },
        ],
      },
      steps: n(
        'Second purpose: safety and efficiency.',
        'Preserve aviation safety. The primary purpose of RBA is to reduce accidents and preserve today\'s historically low rate of fatal air accidents, by focusing oversight on the most consequential risks.',
        'Optimise oversight resources. RBA enables a more effective use of the oversight resources that are available.',
      ),
    },
    {
      id: 'm1-cmp', templateId: 'compare-columns', assertion: 'Traditional vs. Risk-Based IOSA', sourceRefs: src(18),
      data: {
        left: { heading: 'Traditional IOSA', items: ['Full ISARP checklist every cycle', 'Same depth regardless of risk'], tag: 'Conformance-focused' },
        right: { heading: 'Risk-Based IOSA', items: ['Scope and depth driven by risk', 'Focus on safety-critical areas'], tag: 'Maturity-focused' },
      },
      steps: n(
        'Traditional IOSA applies the full ISARP checklist uniformly at every audit cycle, with the same audit depth regardless of operational risk or safety performance history. It is conformance-focused: documented and implemented.',
        'Risk-Based IOSA drives scope and depth by operational risk and safety significance. It focuses on safety-critical areas and end-to-end process effectiveness. It is maturity-focused: performance and results driven.',
        'Same standards. The difference is where the effort goes, and what we test.',
      ),
    },
    {
      id: 'm1-scope', templateId: 'card-row', assertion: 'How RBI Changes Audit Scoping', sourceRefs: src(19),
      data: {
        cards: [
          { code: 'Scenario A', title: 'Rising Risk, Deeper Audit', icon: 'trending-up' },
          { code: 'Scenario B', title: 'Stable Area, Lighter Coverage', icon: 'scale' },
          { code: 'Key Message', title: 'Effort Moves Toward Risk', icon: 'target' },
        ],
        highlight: 2,
      },
      steps: n(
        'How does RBI change audit scoping? Two scenarios.',
        'Scenario A. Rising safety event exposure in a critical area leads to deeper, more frequent audit attention.',
        'Scenario B. Stable conformity in lower-criticality areas may justify lighter coverage.',
        'The key message: audit effort is redistributed toward the risks.',
      ),
    },
    {
      id: 'm1-scen-a', templateId: 'compare-columns', eyebrow: 'Scenario A', assertion: 'New Aircraft Type', sourceRefs: src(20),
      data: {
        left: { heading: 'What the Data Shows', icon: 'chart-line', items: ['Unstable approaches +31%, new type only', 'Differences training at 82%'] },
        right: { heading: 'How the Audit Changes', icon: 'crosshair', items: ['Scope narrows to approach and landing'] },
      },
      steps: n(
        'Scenario A: a new aircraft type, with increasing approach and landing events. What the data shows: unstable approach events are up 31% on the new type, and flat across all other fleets. Differences training is complete for only 82% of line crew.',
        'How the audit changes: the scope narrows from "flight operations" to approach and landing on that type. The audit scope is tailored to the operator\'s risk profile.',
        'The data told us where to look.',
      ),
    },
    {
      id: 'm1-scen-b', templateId: 'compare-columns', eyebrow: 'Scenario B', assertion: 'Stable Cabin Operations', sourceRefs: src(21),
      data: {
        left: { heading: 'What the Data Shows', icon: 'chart-line', items: ['No occurrence trend', 'No open findings', 'No post-holder change'] },
        right: { heading: 'How the Audit Changes', icon: 'file-search', items: ['Coverage kept, depth reduced', 'Smaller sample, still representative'] },
      },
      steps: n(
        'Scenario B: stable cabin operations. There has been no adverse trend in 24 months. What the data shows: no occurrence trend, no open findings, and no post-holder change.',
        'How the audit changes: coverage is retained, but the depth is reduced to document and record review. The sample is reduced, but it is still representative.',
        'Lighter does not mean skipped. The area is still covered.',
      ),
    },
    {
      id: 'm1-benefits', templateId: 'card-row', eyebrow: 'IOSA Vision', assertion: 'Benefits of the Risk-Based Approach', sourceRefs: src(22),
      data: {
        cards: [
          { title: 'Operators', detail: 'Scope tailored to where effort is needed', icon: 'plane' },
          { title: 'Regulators', detail: 'Greater insight into operator safety systems', icon: 'building' },
          { title: 'Industry', detail: 'Improved safety levels industry-wide', icon: 'network' },
        ],
      },
      steps: n(
        'The IOSA vision: value across the aviation ecosystem.',
        'Operators. Audit scope is tailored to where effort is needed most. Safety systems and audit methods get a maturity evaluation. Improved audit reports give sharper insight.',
        'Regulators. Greater insight into operator safety systems and programmes. Stronger audit results through improved reporting. IOSA works as a complement to safety oversight.',
        'Industry. Improved safety levels industry-wide, and more opportunities for regional and global risk management.',
      ),
    },
    {
      id: 'm1-model', templateId: 'procedure-flow', assertion: 'The IOSA RBI Model in Practice', sourceRefs: src(23),
      data: { steps: ['Risk-Based Prioritisation', 'Focus on High-Risk Areas', 'Tailored Audit Scope', 'Reduced Low-Risk Frequency'] },
      steps: n(
        'The RBI audit model in practice. It starts with risk-based prioritisation.',
        'Then the focus goes to the high-risk areas.',
        'That gives a tailored audit scope.',
        'And a reduced frequency for the low-risk areas.',
        'Four parts, one model. Every module after this one uses it.',
      ),
    },
    {
      id: 'm1-kp', templateId: 'key-points', assertion: 'Module 1 — Key Points', sourceRefs: src(25),
      data: {
        points: [
          { title: 'Effort, Not Scrutiny', detail: 'Scrutiny is not reduced' },
          { title: 'Depth Follows Risk', detail: 'Calibrated to operational risk' },
          { title: 'Test Effectiveness', detail: 'Do controls work in practice?' },
        ],
      },
      steps: n(
        'What to carry into the rest of the course. Effort, not scrutiny. RBI redistributes audit effort toward significance. It does not reduce the scrutiny applied.',
        'Depth follows risk. Scope, sampling and follow-up are calibrated to operational risk and safety significance.',
        'Test effectiveness. Auditors test whether controls work in practice, not only whether procedures exist on paper.',
        'That closes Module 1.',
      ),
    },
    {
      id: 'm1-brk', templateId: 'break', sourceRefs: src(26),
      data: { kind: 'Tea Break', ended: 'Module 1', next: { code: 'Module 2', title: 'RBI, SMS and Internal Assurance' } },
      steps: n('Tea break. End of Module 1. We resume with Module 2: RBI, SMS and internal assurance.'),
    },
  ],
};

/** Module 2 · RBI, SMS and Internal Assurance (Day 1, source slides 27–34). */
export const IOSA_RBI_M2: SlideDeckSpecInput = {
  ...BASE,
  module: { code: 'RBI M2', title: 'RBI, SMS and Internal Assurance' },
  lesson: { title: 'Day 1 — Fundamentals', objectives: ['Connect RBI principles with SMS processes'] },
  slides: [
    {
      id: 'm2-open', templateId: 'module-opener', sourceRefs: src(27),
      data: {
        number: '2',
        title: 'RBI, SMS and Internal Assurance',
        objectives: [
          'Connect RBI principles with SMS processes',
          "Trace the auditor's SRM process",
          'See how hazard data focuses audits',
          'Describe quality and safety assurance roles',
        ],
        image: 'a321-34',
      },
      steps: n('Module 2: RBI, SMS and internal assurance. Four objectives. Connect RBI principles with SMS processes. Trace the safety risk management process the auditor follows. See how hazard data supports audit focus. And describe the quality and safety assurance roles.'),
    },
    {
      id: 'm2-sms', templateId: 'checklist', assertion: 'Your SMS Tells the Auditor Where to Focus', sourceRefs: src(28),
      data: {
        items: [
          'Hazard and occurrence reports',
          'Safety trends and SPIs',
          'Risk assessments and register',
          'Mitigation effectiveness evidence',
          'Management review conclusions',
          'Action tracking and closure',
        ],
      },
      steps: n(
        'RBI concentrates audit effort where safety risk is greatest, and your SMS is the primary source. These are the SMS inputs that drive audit readiness. First: hazard and occurrence reporting.',
        'Safety trend analysis, and the movement of your safety performance indicators.',
        'Risk assessments, and the outputs of your risk register.',
        'Evidence that your mitigations are effective.',
        'The conclusions of your management reviews.',
        'And the records of action tracking and closure.',
        'If these six are strong, the auditor knows where to look. So do you.',
      ),
    },
    {
      id: 'm2-signal', templateId: 'card-row', assertion: 'From Signal to Audit Decision', sourceRefs: src(29),
      data: {
        cards: [
          { title: 'The Signal', detail: 'Report, SPI, trend, finding', icon: 'bell-ring' },
          { title: 'Interpret It', detail: 'Control problem or one-off?', icon: 'search' },
          { title: 'Audit Trigger', detail: 'What, how deep, which sample?', icon: 'crosshair' },
          { title: 'Assurance Owner', detail: 'Who acts, who verifies?', icon: 'user-check' },
        ],
      },
      steps: n(
        'From safety signal to audit decision, in four steps.',
        'The signal. A hazard report, an SPI movement, an occurrence trend, or an unclosed previous finding.',
        'Interpret it. Is this a control problem or a one-off event? Does the trend point at a process or at a person?',
        'The audit trigger. What would we go and look at, how deeply, and what sample would make the answer credible?',
        'The assurance owner. Who acts on the outcome, and who independently verifies that the action worked?',
      ),
    },
    {
      id: 'm2-roles', templateId: 'card-row', assertion: 'Internal Assurance Roles Must Connect', sourceRefs: src(30),
      data: {
        cards: [
          { title: 'Operational Management', detail: 'Owns processes and daily compliance', icon: 'users' },
          { title: 'Performance Monitoring', detail: 'Monitors, reviews, challenges performance', icon: 'gauge' },
          { title: 'Internal Audit', detail: 'Independent assurance to management', icon: 'shield-check' },
        ],
      },
      steps: n(
        'Three roles: operational management, safety and QA, and internal audit. They must connect. Operational management owns the processes and the daily compliance.',
        'Safety and QA do performance monitoring. They monitor, review and challenge performance.',
        'Internal audit provides independent assurance to management.',
        'If one link is missing, the loop does not close.',
      ),
    },
    {
      id: 'm2-ws1', templateId: 'compare-columns', eyebrow: 'Load Control, Outstation', assertion: 'Workshop 1 — Compliance vs. Risk', sourceRefs: src(31),
      data: {
        left: { heading: 'Team A: Compliance', icon: 'list-checks', items: ['Same checklist, every cycle', 'Proves the control exists'] },
        right: { heading: 'Team B: Risk-Based', icon: 'crosshair', items: ['Scope driven by risk data', 'Tests if the control works'] },
      },
      steps: n(
        'Workshop 1: compliance versus risk. The process is load control and weight and balance at an outstation. Team A audits as a compliance team: same checklist, same depth, every cycle. That proves the control exists.',
        'Team B audits risk-based: scope and depth are driven by risk data. That tests whether the control works.',
        'The output is an RBI Working Charter. Please refer to your Participant Workbook.',
      ),
    },
    {
      id: 'm2-ws1-steps', templateId: 'procedure-flow', eyebrow: 'Workshop 1 · 40 Minutes', assertion: 'Load Control and Weight and Balance at an Outstation', sourceRefs: src(32),
      data: { steps: ['Read Your Brief', 'Set Your Scope', 'Size the Sample', 'Name the Evidence', 'Build the Charter'] },
      steps: n(
        'Read your brief. Groups A and C audit as a compliance team. Groups B, D and E audit as a risk team. Same process, different mandate.',
        'Set your scope. Decide exactly what you will audit, and what you will deliberately leave out.',
        'Size the sample. State how much you will examine, and the reason that amount is enough.',
        'Name the evidence. List what you will ask to see, read, watch or hear. Then write the finding you expect.',
        'Build the charter. Report out, compare the two approaches, and agree six working rules for Thai Airways internal audit.',
        'You have 40 minutes.',
      ),
    },
    {
      id: 'm2-kp', templateId: 'key-points', assertion: 'Module 2 — Key Points', sourceRefs: src(33),
      data: {
        points: [
          { title: 'SMS Points First', detail: 'Primary source of the risk picture' },
          { title: 'Convert the Signal', detail: 'Into a scoped audit decision' },
          { title: 'The Loop Must Close', detail: 'Or the same weakness recurs' },
        ],
      },
      steps: n(
        'Your SMS is the auditor\'s map. SMS points first. The SMS is the primary source of the risk picture that decides where audit effort is spent.',
        'Convert the signal. A safety signal is only useful once it becomes an audit decision with a defined scope and depth.',
        'The loop must close. Operations, assurance and internal audit must connect, or the same weakness recurs unseen.',
        'That closes Module 2.',
      ),
    },
    {
      id: 'm2-lunch', templateId: 'break', sourceRefs: src(34),
      data: { kind: 'Lunch Break', ended: 'Module 2', next: { code: 'Module 3', title: 'IOSA Renewal Readiness' } },
      steps: n('Lunch break. We will resume at the scheduled time. The afternoon sessions cover IOSA renewal readiness, process-based thinking, and the renewal timeline workshop.'),
    },
  ],
};

export const IOSA_RBI_MODULES = { 'rbi-m0': IOSA_RBI_M0, 'rbi-m1': IOSA_RBI_M1, 'rbi-m2': IOSA_RBI_M2 };
