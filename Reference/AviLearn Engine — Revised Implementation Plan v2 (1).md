# AviLearn Engine — Revised Implementation Plan v2
## Dynamic Simulation Generator + AI-Orchestrated Content Transformation
---
## Executive Summary
This revision reflects two strategic clarifications that fundamentally reshape Phase 2 and Phase 3 of the AviLearn Engine roadmap. **Phase 2** is no longer about building one specific simulation (the Fishbone diagram); it becomes a **Simulation Generator** — an AI-agent-driven system capable of researching, recommending, and producing any pedagogically appropriate interactive simulation from learning content. **Phase 3** shifts from traditional content authoring to an **Immersive Content Transformation Pipeline** — taking existing PPTX, Word, PDF, and video assets and transforming them into rich HTML5, animated slides, and rendered video using AI agents as the orchestrators. The user's role throughout is creative direction and light editing, not content production.

Phase 1 (SCORM/cmi5 packaging infrastructure) and the backend stack (Supabase + Node.js) are unchanged.

***
## Revised Architecture Overview
```
                        ┌─────────────────────────────────────────┐
                        │          AviLearn Engine                │
                        │       (Next.js 14 + Supabase)           │
                        └──────────────┬──────────────────────────┘
                                       │
              ┌────────────────────────┼──────────────────────────┐
              │                        │                           │
   ┌──────────▼──────────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐
   │   PHASE 1           │  │   PHASE 2            │  │   PHASE 3           │
   │   Package Engine    │  │   Simulation         │  │   Content           │
   │                     │  │   Generator          │  │   Transformer       │
   │ • SCORM 1.2 ZIP     │  │                      │  │                     │
   │ • cmi5 AU bundle    │  │ • AI Agent Cluster   │  │ • PPTX → HTML5      │
   │ • imsmanifest.xml   │  │ • Sim Recommender    │  │ • PDF → Slides      │
   │ • Supabase Storage  │  │ • Sim Code Generator │  │ • Video → Narrated  │
   │ • LRS integration   │  │ • xAPI Wrapper       │  │ • Word → Interactive│
   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                       │                           │
                        ┌──────────────▼──────────────────────────▼──────────┐
                        │           AI Orchestration Layer                    │
                        │   OpenAI Agents SDK (TypeScript) + LangGraph        │
                        │                                                     │
                        │  [Planner] → [Researcher] → [Generator]            │
                        │      → [Reviewer/SME Gate] → [Packager]            │
                        └─────────────────────────────────────────────────────┘
```

***
## Phase 2 — The Simulation Generator
### Concept
The Simulation Generator is not a Fishbone tool. It is an **agent-driven capability** that, given any learning module's content and objectives, can research appropriate simulation types, recommend the most pedagogically effective one for that specific content, generate working simulation code, wrap it in a cmi5 AU, and output a deployable package. The Fishbone diagram used in the Module 14 POC is simply one *instance* of what this system can produce.
### What "Appropriate Simulation" Means
Given aviation training content, the simulation type will vary dramatically:

| Learning Content Type | Example Module | Recommended Sim Type |
|---|---|---|
| Root Cause Analysis | Module 14 (RCA) | Ishikawa / 5-Why builder |
| Hazard identification | SMS / Ramp Safety | Clickable scenario walkthrough |
| Instrument procedure | Approach plate briefing | Step-sequencing simulator |
| Human Factors | CRM / SHELL model | Decision-tree scenario |
| NDT inspection | Borescope / eddy current | Drag-and-drop defect identifier |
| Emergency procedure | Fire / evac drill | Timed branching scenario |
| Regulatory compliance | Part 145 / EASA-66 | Case study + classification exercise |
| Data entry / paperwork | Form 1 / Release cert | Fillable form validator |

The agent cluster is responsible for selecting from this type space, not the author. The author confirms or redirects.
### AI Agent Cluster Architecture
The Simulation Generator uses a **Supervisor → Specialist** multi-agent pattern built on the **OpenAI Agents SDK for TypeScript** — the preferred choice over LangGraph for a Node.js backend because it is provider-agnostic, natively TypeScript, and supports agent handoffs with structured outputs out of the box. LangGraph remains an option for more complex stateful workflows if needed.[^1][^2][^3][^4]

```
User triggers "Generate Simulation" for a course module
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  SUPERVISOR AGENT                                     │
│  - Reads slide content + learning objectives          │
│  - Assesses content domain (RCA, procedure, HF, etc.) │
│  - Routes to appropriate specialist agent             │
└──────────────────────┬────────────────────────────────┘
                       │  handoff
        ┌──────────────┼──────────────────────┐
        │              │                      │
┌───────▼──────┐ ┌─────▼────────┐ ┌──────────▼─────────┐
│ RESEARCHER   │ │ SIM DESIGNER │ │ VERIFIER            │
│ AGENT        │ │ AGENT        │ │ AGENT               │
│              │ │              │ │                     │
│ - Searches   │ │ - Selects    │ │ - Reviews generated │
│   pedagogic  │ │   sim type   │ │   sim code against  │
│   best       │ │ - Generates  │ │   learning objective│
│   practice   │ │   HTML/JS    │ │ - Flags SME review  │
│   for domain │ │   sim code   │ │   items             │
│ - Returns    │ │ - Wraps in   │ │ - Scores pedagogic  │
│   sim type   │ │   cmi5 AU    │ │   quality           │
│   options    │ │              │ │                     │
└──────────────┘ └─────────────┘ └─────────────────────┘
        │              │                      │
        └──────────────▼──────────────────────┘
                       │
        ┌──────────────▼─────────────────────────────┐
        │  USER REVIEW INTERFACE                      │
        │  "Here's the proposed simulation: [type]    │
        │   Preview → Approve / Request changes"      │
        └──────────────┬─────────────────────────────┘
                       │ Approved
        ┌──────────────▼─────────────────────────────┐
        │  PACKAGER AGENT                             │
        │  - Builds cmi5 AU bundle                    │
        │  - Uploads to Supabase Storage              │
        │  - Logs simulation metadata to DB           │
        └─────────────────────────────────────────────┘
```
### Simulation Code Generation
The SIM DESIGNER Agent uses Remotion for complex animated simulations and raw HTML/CSS/JS via the frontend-slides pattern for lighter interactive exercises. Remotion's LLM-generation API allows the agent to generate a complete React-based simulation component from a natural language description of the learning scenario:[^5][^6][^7][^8]

```typescript
// services/agents/simDesignerAgent.ts
import { Agent } from '@openai/agents';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const simDesignerAgent = new Agent({
  name: 'SimDesigner',
  instructions: `You are an aviation training simulation designer.
Given a simulation type recommendation and learning objectives,
generate a self-contained HTML5 simulation that:
1. Is directly relevant to the aviation content provided
2. Includes xAPI/cmi5 statement emission on completion
3. Requires learner interaction to proceed (not passive)
4. Is accessible (WCAG AA) and mobile-responsive
5. Includes an SME review flag on any procedural step that requires verification
Output: JSON with { simType, htmlCode, xapiVerb, learningObjective, smeFlags[] }`,
  tools: [generateSimCode, wrapInCmi5AU, validateXapiStatements]
});

// Remotion-based code generation for complex animated simulations
async function generateRemotionSim(scenario: string, objectives: string[]) {
  const { text: code } = await generateText({
    model: openai('gpt-4o'),
    system: `You are a Remotion component generator for aviation training.
Generate a React component using Remotion's useCurrentFrame() and spring() for animations.
The simulation must emit xAPI statements via window.cmi5.sendStatement() on key interactions.`,
    prompt: `Create a simulation for: ${scenario}
Learning objectives: ${objectives.join(', ')}`
  });
  return code;
}
```
### Simulation Type Library (Growing)
The system ships with a type library that expands over time. Each type has a generation template, a cmi5 manifest template, and a default xAPI verb mapping:

```
sim-types/
├── ishikawa-builder.template.html     (RCA / fault analysis)
├── five-why-chain.template.html       (iterative root cause)
├── decision-tree.template.html        (HF / CRM scenarios)
├── step-sequencer.template.html       (procedures / checklists)
├── drag-drop-matcher.template.html    (terminology / classification)
├── hotspot-diagram.template.html      (inspection / identification)
├── timed-scenario.template.html       (emergency drills)
├── form-validator.template.html       (paperwork / documentation)
└── branching-story.template.html      (case studies / narrative)
```

Each template is a fully functional HTML file that the SIM DESIGNER Agent populates with course-specific content. New types are added to the library whenever the agent recommends a simulation for which no existing template exists — the agent generates a new template, which is reviewed and committed as a new type.

***
## Phase 3 — The Immersive Content Transformation Pipeline
### Concept
AviLearn does not generate training content from scratch. It **transforms existing content** — PowerPoint decks, PDF manuals, Word SOPs, and video recordings — into immersive, HTML5-driven learning experiences. The AI agents are the orchestrators of this transformation; the author provides source material and creative direction only.
### Transformation Stack
| Source Format | Tool | Output |
|---|---|---|
| PPTX | frontend-slides skill (Claude)[^7][^8] | Zero-dependency animated HTML5 slides |
| PDF / Word SOP | PDF text extraction → GPT-4o → HTML5 | Interactive HTML slides with hotspots |
| Video (talking head, procedure demo) | video-use (browser-use)[^9] | Edited MP4 with overlays, cuts, annotations |
| Video (any) | HyperFrames (HeyGen)[^10][^11][^12] | Re-rendered HTML-to-video with new visual layers |
| PPTX + narration | Remotion + GPT-4o[^5][^6] | Animated video composition from slide content |
### The Transformation Agent Workflow
```
User uploads: Module14_RCA.pptx  (or .pdf / .docx / .mp4)
                    │
                    ▼
        ┌───────────────────────┐
        │  INTAKE AGENT         │
        │  Parses format,       │
        │  extracts structure,  │
        │  identifies content   │
        │  type and density     │
        └──────────┬────────────┘
                   │
        ┌──────────▼────────────┐
        │  ENRICHMENT AGENT     │
        │  Analyses each slide/ │
        │  section and tags:    │
        │  - static text        │
        │  - diagram/visual     │
        │  - procedure/checklist│
        │  - data/chart         │
        └──────────┬────────────┘
                   │
        ┌──────────▼────────────────────────────────────┐
        │  TRANSFORMATION ROUTER                        │
        │                                               │
        │  IF rich animation requested                  │
        │    → frontend-slides skill (HTML output)      │
        │                                               │
        │  IF video output requested                    │
        │    → HyperFrames (HTML → MP4)  │
        │    → OR video-use for existing footage  │
        │    → OR Remotion for data-driven video  │
        │                                               │
        │  IF interactive simulation appropriate        │
        │    → handoff to Phase 2 Simulation Generator  │
        │                                               │
        │  IF light HTML conversion sufficient          │
        │    → simple slide renderer (Phase 1 stack)    │
        └──────────┬────────────────────────────────────┘
                   │
        ┌──────────▼────────────┐
        │  QUALITY AGENT        │
        │  Reviews output for:  │
        │  • Aviation accuracy  │
        │  • WCAG compliance    │
        │  • Learning objective │
        │    alignment          │
        │  • SME review flags   │
        └──────────┬────────────┘
                   │
        ┌──────────▼────────────┐
        │  USER REVIEW UI       │
        │  Preview → Light edit │
        │  → Approve → Package  │
        └───────────────────────┘
```
### HyperFrames Integration
HyperFrames (Apache 2.0, open source as of April 2026) is particularly well-suited to AviLearn because it is explicitly **agent-native** — AI coding agents write video compositions as plain HTML, and the framework renders them to MP4 via headless Chrome and FFmpeg. This means the TRANSFORMATION AGENT can produce video output using the same HTML skills it already uses for slide generation:[^11][^12][^13]

```
Agent writes HTML composition:
  <div data-clip data-duration="4s" data-start="0s">
    <h2 class="fade-in">Root Cause Analysis</h2>
    <p class="subtitle">Module 14 — Aviation Maintenance</p>
  </div>
  <div data-clip data-duration="6s" data-start="4s">
    <!-- Fishbone diagram animates in -->
  </div>

→ npx hyperframes render --output module14-intro.mp4
→ MP4 uploaded to Supabase Storage
→ Embedded in cmi5 AU as video asset
```

HyperFrames also ships a visual Timeline Editor (launched April 2026), meaning non-technical authors can adjust timing and trim scenes after the agent has generated the composition — precisely the "light editing" model described for AviLearn.[^11]
### video-use Integration
For existing video footage — recorded procedure demonstrations, SME walkthroughs, screen captures — **video-use** (browser-use, open source) provides agent-driven editing via Claude Code:[^9]

- Drop raw footage into a folder
- Agent reads via audio transcript (word-level timestamps, speaker diarization via ElevenLabs Scribe) and frame-level visual scan[^9]
- Agent proposes edit strategy, waits for user approval, then renders `final.mp4`
- Animation overlays via Manim, Remotion, or PIL are spawned as parallel sub-agents[^9]
- Session memory persists in `project.md` so iterative editing resumes from the last state[^9]

This gives AviLearn the ability to take a recorded SME explanation of a procedure and turn it into a polished, annotated, time-accurate training video — without the instructor touching a video editor.
### frontend-slides Integration
For PPTX → HTML5 transformation, the **frontend-slides Claude skill** handles the conversion with full animation support, outputting a zero-dependency single HTML file. The TRANSFORMATION AGENT invokes this skill and passes the extracted PPTX content:[^7][^14][^8]

```
1. Parse PPTX with python-pptx (server-side) → extract slide text + structure
2. Invoke frontend-slides skill prompt with extracted content
3. Agent generates animation-rich HTML5 presentation
4. Quality Agent reviews for aviation accuracy + SME flags
5. Author previews, makes light edits (text corrections only)
6. Packager wraps as SCORM 1.2 ZIP → Supabase Storage
```

***
## Revised Phase Breakdown
### Phase 1 — Weeks 1–3: Package Engine (Unchanged)
*Build real SCORM ZIP + cmi5 AU generation. Validate against LMS. Seed Module 14.*

See v1 plan for full implementation details. Output: working export pipeline.

***
### Phase 2 — Weeks 4–9: Simulation Generator
**Week 4–5: Agent Cluster Foundation**
- [ ] Install OpenAI Agents SDK for TypeScript[^3]
- [ ] Build SUPERVISOR AGENT with content domain classifier (RCA, procedure, HF, NDT, etc.)
- [ ] Build RESEARCHER AGENT: searches pedagogic best practice for domain, returns sim type recommendation
- [ ] Implement agent handoff chain: Supervisor → Researcher → SIM DESIGNER → Verifier
- [ ] Instrument with LangSmith or Supabase logs for agent trace observability

**Week 5–6: Simulation Type Library + Code Generator**
- [ ] Build initial 4 sim templates: `ishikawa-builder`, `decision-tree`, `step-sequencer`, `hotspot-diagram`
- [ ] SIM DESIGNER Agent: populate templates with course-specific content via GPT-4o structured output
- [ ] Wire cmi5 xAPI statement emission into every template (launched, passed, completed verbs)
- [ ] Test Module 14 → Agent recommends Ishikawa → generates populated HTML simulation

**Week 7–8: Remotion Integration (for animated/complex sims)**
- [ ] Integrate Remotion LLM generation API[^5]
- [ ] SIM DESIGNER routes to Remotion for procedure-sequence or timed-scenario types
- [ ] Headless rendering pipeline: `npx remotion render` → MP4 → Supabase Storage
- [ ] Embed rendered video as asset inside cmi5 AU

**Week 9: User Review Interface + Simulation Library Management**
- [ ] Preview modal: agent proposes sim type + renders preview → user approves/redirects
- [ ] Simulation library admin: view all generated sim types, promote to library, deprecate
- [ ] SME flag workflow: VERIFIER AGENT flags content items needing expert review
- [ ] **Deliverable**: Generate a working cmi5 simulation from any uploaded module — no human code

***
### Phase 3 — Weeks 10–16: Immersive Content Transformation Pipeline
**Week 10–11: PPTX/PDF → HTML5 (frontend-slides)**
- [ ] INTAKE AGENT: parse PPTX with `python-pptx` (or `officegen` Node.js) → structured JSON
- [ ] ENRICHMENT AGENT: classify each slide (text-heavy, diagram, procedure, data)
- [ ] Invoke frontend-slides skill via Claude API call → animated HTML5 output[^7]
- [ ] QUALITY AGENT: review HTML against learning objectives + flag SME items
- [ ] Light-edit interface: simple text correction + style preset selection (no HTML editing)
- [ ] Test: Module 14 PPTX → animated HTML5 course → SCORM ZIP → LMS

**Week 12–13: HyperFrames Integration (HTML → Video)**
- [ ] Install HyperFrames CLI (`npx hyperframes`)[^11][^12]
- [ ] TRANSFORMATION AGENT: for video-output requests, converts enriched HTML → HyperFrames composition
- [ ] Render pipeline: HyperFrames → MP4 via headless Chrome + FFmpeg[^13]
- [ ] Timeline Editor surfaced in AviLearn UI for author light editing[^11]
- [ ] Upload rendered MP4 to Supabase Storage → embed in cmi5 AU

**Week 14: video-use Integration (Existing Footage)**
- [ ] Integrate video-use project as a backend microservice or subprocess[^9]
- [ ] Upload interface: author drops raw `.mp4` footage into AviLearn
- [ ] Agent pipeline: transcript extraction → visual frame scan → edit strategy proposal
- [ ] Author approves → agent renders `final.mp4` with annotations/overlays
- [ ] Output feeds into Transformation Pipeline as video-type content asset

**Week 15–16: Pipeline Integration + Quality Gate**
- [ ] Unified TRANSFORMATION ROUTER: single upload → agent decides optimal tool chain
- [ ] End-to-end test: PDF → HTML5 slides → simulation recommendation → video render → SCORM ZIP
- [ ] SME review dashboard: all flagged items from all agents in one review queue
- [ ] Audit trail: every agent decision logged with source, tool used, confidence score
- [ ] **Deliverable**: Full transformation of Module 14 from raw PPTX + any video assets into an immersive, SCORM/cmi5-packaged course — author time under 30 minutes

***
### Phase 4 — Weeks 17–20: Hardening, Simulation Library Growth, Analytics
- [ ] Self-improving simulation library: new sims generated in Phases 2–3 reviewed and promoted to templates
- [ ] LRS analytics dashboard: xAPI data surfaces learner performance per simulation type
- [ ] Multi-format intake expansion: Word DOCX, scanned PDF (OCR), audio narration
- [ ] Regression testing: agent outputs validated against a bank of known-good aviation training examples
- [ ] Production deployment + CI/CD pipeline

***
## Technology Additions (vs v1 Plan)
| Addition | Purpose | Phase |
|---|---|---|
| OpenAI Agents SDK (TypeScript)[^3][^4] | Supervisor/Specialist multi-agent orchestration | 2 |
| HyperFrames (HeyGen, Apache 2.0)[^10][^11][^12] | HTML → MP4 video rendering, agent-native | 3 |
| video-use (browser-use, open source)[^9] | AI-driven editing of existing video footage | 3 |
| Remotion[^5][^6][^15] | React-based programmatic video for complex animated sims | 2, 3 |
| frontend-slides (Claude skill)[^7][^8] | PPTX/content → zero-dependency animated HTML5 | 3 |
| python-pptx (server subprocess) | PPTX structural parsing | 3 |
| FFmpeg (system dependency) | Video encoding for HyperFrames + Remotion output | 2, 3 |
| LangSmith (optional) | Agent trace observability and debugging[^1] | 2 |

***
## Revised Folder Structure (Additions Only)
```
backend/
├── agents/                              ← NEW: AI agent cluster
│   ├── supervisor.agent.ts             ← Routes by content domain
│   ├── researcher.agent.ts             ← Pedagogic sim type research
│   ├── simDesigner.agent.ts            ← Simulation code generation
│   ├── verifier.agent.ts               ← Quality + SME flag reviewer
│   ├── intake.agent.ts                 ← Source format parsing
│   ├── enrichment.agent.ts             ← Slide/section classification
│   ├── transformRouter.agent.ts        ← Tool chain selector
│   └── qualityGate.agent.ts            ← Pre-package validation
│
├── sim-types/                           ← NEW: Simulation template library
│   ├── ishikawa-builder.template.html
│   ├── decision-tree.template.html
│   ├── step-sequencer.template.html
│   ├── hotspot-diagram.template.html
│   └── [grows with each new generation]
│
├── services/
│   ├── transform/                       ← NEW: Content transformation
│   │   ├── pptxParser.ts               ← python-pptx subprocess
│   │   ├── pdfExtractor.ts             ← PDF text + structure
│   │   ├── frontendSlidesInvoker.ts    ← Claude frontend-slides skill
│   │   ├── hyperframesRenderer.ts      ← HyperFrames CLI wrapper
│   │   ├── videoUseProcessor.ts        ← video-use integration
│   │   └── remotionRenderer.ts         ← Remotion Lambda/CLI
│   └── [existing scorm/, cmi5/, ai/]
```

***
## Design Principle: The AI as Orchestrator
The architectural philosophy of AviLearn — established in this revision — is that the AI agent cluster makes the decisions; the author makes the creative judgements. This is consistent with the 2026 pattern of multi-agent systems with planner, executor, and verifier roles that have become production-ready infrastructure for knowledge work.[^16][^1][^17]

In practice this means:
- **Authors never write HTML, JavaScript, or video timelines.** These are agent outputs.
- **Authors never choose simulation types.** The Researcher Agent proposes; the author confirms or redirects.
- **Authors never edit video timelines.** They use the HyperFrames Timeline Editor to make light adjustments to an agent-built composition.[^11]
- **Authors never write learning objectives from scratch.** The Enrichment Agent extracts them from source material and proposes them for confirmation.
- **The SME Review Gate** remains the one mandatory human touch-point — regulatory compliance for aviation training requires a qualified human to verify procedural content before any package is exported.[^18]

This is not automation for automation's sake. In aviation training, where incorrect content can directly contribute to incidents, the architecture deliberately reserves human authority over content accuracy while delegating all structural and technical production to agents.

---

## References

1. [Best Multi-Agent Frameworks in 2026: LangGraph, CrewAI ...](https://gurusup.com/blog/best-multi-agent-frameworks-2026) - Compare the 6 leading multi-agent frameworks: OpenAI Agents SDK, LangGraph, CrewAI, AutoGen/AG2, Goo...

2. [LangGraph: Agent Orchestration Framework for Reliable AI ...](https://www.langchain.com/langgraph) - Balance agent control with agency. Design agents that reliably handle complex tasks with LangGraph, ...

3. [OpenAI Agents SDK (JavaScript/TypeScript)](https://github.com/openai/openai-agents-js) - The OpenAI Agents SDK is a lightweight yet powerful framework for building multi-agent workflows in ...

4. [Building a Node.js Multi-Agent System with OpenAI ...](https://dev.to/buildandcodewithraman/building-a-nodejs-multi-agent-system-with-openai-agents-sdk-ef9) - Curious about how to bring the power of multi-agent systems into your React applications? OpenAI has...

5. [Generate Remotion Code using LLMs](https://www.remotion.dev/docs/ai/generate) - This guide shows an example of how to generate Remotion component code from natural language prompts...

6. [Remotion: Create Videos Programmatically with React](https://yuv.ai/blog/remotion) - Remotion is a framework that lets us create videos programmatically using React components instead o...

7. [Frontend Slides](https://www.claudepluginhub.com/skills/burgebj-everything-claude-code-2/frontend-slides) - Generates zero-dependency HTML slide presentations with inline CSS/JS and animations. Use for new de...

8. [zarazhangrui/frontend-slides: Create beautiful ...](https://github.com/zarazhangrui/frontend-slides) - Frontend Slides. A Claude Code skill for creating stunning, animation-rich HTML presentations — from...

9. [Akshay Gir's Post - Edit videos with coding agents](https://www.linkedin.com/posts/akshay-gir_github-browser-usevideo-use-edit-videos-activity-7456148910298927104-1msU) - **Introducing video-use — edit videos with Claude Code. 100% open source.** Video editing just got a...

10. [heygen-com/hyperframes: Write HTML. Render video. Built ...](https://github.com/heygen-com/hyperframes) - Hyperframes is an open-source video rendering framework that lets you create, preview, and render HT...

11. [What's New at HeyGen: April 2026 Product Updates](https://www.heygen.com/blog/heygen-april-2026-release) - HyperFrames is now open source under Apache 2.0. The pitch is wild. You write videos as plain HTML. ...

12. [Video as Code: A Deep Dive into HeyGen's Hyperframes](https://www.linkedin.com/pulse/video-code-deep-dive-heygens-hyperframes-nidhin-kumar-vw8pc) - It's an open-source framework that lets you write HTML, style it with CSS, and render it into determ...

13. [Video as Code: A Deep Dive into HeyGen's Hyperframes](https://blog.nidhin.dev/video-as-code-a-deep-dive-into-heygen-s-hyperframes) - It's an open-source framework that lets you write HTML, style it with CSS, and render it into determ...

14. [Frontend Slides - Create Web Presentations - Shyft](https://shyft.ai/skills/frontend-slides) - @zarazhangrui. Create stunning HTML presentations with animations from scratch or convert PowerPoint...

15. [remotion-dev/remotion: 🎥 Make videos programmatically ...](https://github.com/remotion-dev/remotion) - Remotion is a framework for creating videos programmatically using React. Why create videos in React...

16. [The 2026 Path to Learning AI Agents](https://aiagentssimplified.substack.com/p/the-2026-path-to-learning-ai-agents) - A Complete 2026 Guide to the Skills, Workflows, Tools, and Courses for Building Real AI Agents.

17. [Orchestrating Multi-Agent Systems with LangGraph and MCP](https://healthark.ai/orchestrating-multi-agent-systems-with-lang-graph-mcp/) - Understand how LangGraph and MCP simplify multi-agent coordination with dynamic task graphs, context...

18. [10 Best AI E-Learning Platforms and Tools in 2026 | TTMS](https://ttms.com/10-top-ai-e-learning-tools/) - Renowned for its ability to create complex simulations and software training, Adobe Captivate now au...

