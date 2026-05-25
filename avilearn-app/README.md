<p align="center">
  <img src="public/favicon.ico" width="56" height="56" alt="AviLearn logo" />
</p>

<h1 align="center">AviLearn Engine</h1>

<p align="center">
  <strong>AI-Powered Aviation Training &amp; Learning Management Platform</strong><br />
  Dynamic Simulation Generator · AI-Orchestrated Content Transformation · SCORM/cmi5 Packaging
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI_SDK-Anthropic-FF6B35" alt="AI SDK" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Private-gray" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Current Capabilities](#current-capabilities)
  - [Learning Management Console](#learning-management-console)
  - [AI Agent Cluster — Simulation Generator](#ai-agent-cluster--simulation-generator)
  - [E-Learning Standards Engine](#e-learning-standards-engine)
  - [Database & Backend](#database--backend)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Development Roadmap](#development-roadmap)
- [Design Philosophy](#design-philosophy)
- [Contributing](#contributing)

---

## Overview

AviLearn Engine is a purpose-built **aviation training and learning management platform** that combines traditional LMS functionality with a cutting-edge AI agent cluster. The platform enables flight schools, Part 145 MROs, and aviation training organisations to:

1. **Manage courses, students, grades, schedules, and flight logs** through a modern instructor console.
2. **Generate pedagogically appropriate interactive simulations** from any learning module — powered by a multi-agent AI pipeline that researches, recommends, generates, and verifies simulation code automatically.
3. **Package all content** as industry-standard SCORM 1.2 and cmi5 AU bundles, ready for deployment to any compliant LMS.

> The platform's core principle: **AI agents make the technical decisions; instructors make the creative and safety judgements.** Authors never write HTML, choose simulation types, or edit video timelines. The SME (Subject Matter Expert) review gate is the mandatory human checkpoint — because in aviation training, incorrect content can directly contribute to incidents.

---

## Architecture

```
                    ┌───────────────────────────────────────────┐
                    │           AviLearn Engine                 │
                    │        Next.js 16 + Supabase              │
                    └──────────────┬────────────────────────────┘
                                   │
          ┌────────────────────────┼──────────────────────────┐
          │                        │                           │
┌─────────▼──────────┐  ┌─────────▼──────────┐  ┌────────────▼──────────┐
│   PHASE 1          │  │   PHASE 2           │  │   PHASE 3             │
│   Package Engine   │  │   Simulation        │  │   Content             │
│   ✅ Implemented   │  │   Generator         │  │   Transformer         │
│                    │  │   ✅ Implemented    │  │   🔜 Planned          │
│ • SCORM 1.2 ZIP   │  │                     │  │                       │
│ • cmi5 AU bundle  │  │ • AI Agent Cluster  │  │ • PPTX → HTML5        │
│ • imsmanifest.xml │  │ • Sim Recommender   │  │ • PDF → Slides        │
│ • xAPI statements │  │ • Code Generator    │  │ • Video → Narrated    │
│ • Supabase Storage│  │ • Quality Verifier  │  │ • Word → Interactive  │
└────────────────────┘  └─────────────────────┘  └───────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │     AI Orchestration Layer          │
                    │  Vercel AI SDK + Anthropic Claude   │
                    │                                     │
                    │  Supervisor → Researcher →          │
                    │  Sim Designer → Verifier → Packager │
                    └────────────────────────────────────┘
```

---

## Current Capabilities

### Learning Management Console

A full-featured instructor dashboard with role-based navigation, built with Next.js App Router (server components) and Supabase.

| Module | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/dashboard` | KPI cards (active students, flight hours, pending grades, aircraft status), METAR weather display, course modules overview, recent flights table, activity feed |
| **Schedule** | `/schedule` | Weekly calendar grid with flight lesson scheduling, instructor/student/aircraft assignment, week/day/list view modes |
| **Roster** | `/roster` | Student enrollment management with search, flight hour tracking, enrollment status, multi-course support |
| **Courses** | `/courses` | Course catalog with module counts, student enrollment numbers, status management (Draft / Active / Archived), drill-down to modules |
| **Simulations** | `/simulations` | AI simulation library with status filtering (pending review, approved, rejected), quality scores, SME flag indicators, version tracking |
| **Grades** | `/grades` | Grade book with assessment types (quiz, exam, practical, assignment), score tracking, color-coded pass/fail indicators, export capability |
| **Chat** | `/chat` | Direct messaging between instructors and students, contact list, message threading, event sidebar with upcoming schedule items |

**Additional sidebar links** (planned): Mailbox, Reports, Aircraft Management, Weather, Settings.

### AI Agent Cluster — Simulation Generator

The core innovation of AviLearn. A **Supervisor → Specialist** multi-agent pipeline powered by **Anthropic Claude** through the Vercel AI SDK. Given any training module, it autonomously:

```
1. CLASSIFY  → Supervisor identifies the content domain (RCA, procedure, human factors, etc.)
2. RESEARCH  → Researcher recommends the pedagogically optimal simulation type
3. GENERATE  → Sim Designer produces self-contained HTML5 simulation code
4. VERIFY    → Verifier scores quality, checks objectives, flags SME review items
5. PACKAGE   → Packager wraps output as cmi5 AU and uploads to Supabase Storage
```

#### Agent Details

| Agent | Model | Role | Output |
|-------|-------|------|--------|
| **Supervisor** | Claude Opus 4.6 | Content domain classifier — routes modules to the correct pedagogic context | Domain classification with confidence score |
| **Researcher** | Claude Sonnet 4.6 | Pedagogic best-practice researcher — recommends simulation types based on learning science | Simulation type recommendation with rationale |
| **Sim Designer** | Claude Sonnet 4.6 | Interactive HTML5 simulation generator — produces fully self-contained, WCAG-AA-accessible code | Complete working HTML5 simulation |
| **Verifier** | Claude Opus 4.6 | Quality assurance reviewer — evaluates against learning objectives, flags SME items | Score (0–100), pass/fail, interactivity level, SME flags |
| **Packager** | N/A (deterministic) | cmi5 AU wrapper — injects xAPI bridge, uploads to storage | cmi5-compliant package in Supabase Storage |

#### Supported Content Domains

| Domain | Description | Example Module |
|--------|-------------|----------------|
| `rca` | Root cause analysis, fault analysis, Ishikawa, 5-Why | Module 14 — RCA |
| `procedure` | Step-by-step operational or maintenance procedures, checklists | Engine change procedures |
| `human_factors` | CRM, SHELL model, human performance, decision-making | CRM training |
| `ndt_inspection` | Non-destructive testing, borescope, eddy current, visual inspection | NDT qualification |
| `emergency` | Fire, evacuation, abnormal procedures, time-critical actions | Emergency procedures |
| `regulatory` | Part 145, EASA-66, FARs, compliance, documentation requirements | Regulatory compliance |
| `data_entry` | Form completion, release certificates, paperwork validation | Form 1 / Release certs |
| `hazard_id` | Hazard identification, risk assessment, SMS reporting | Safety management |

#### Supported Simulation Types

| Type | Best For | Interaction Style |
|------|----------|-------------------|
| `ishikawa-builder` | Root cause analysis, fault categorization | Drag cause cards onto fishbone branches |
| `five-why-chain` | Tracing causes to root causes | Iterative text input with evaluation |
| `decision-tree` | CRM, human factors, decision-making | Choose-your-path branching scenario |
| `step-sequencer` | Procedures, checklists, maintenance sequences | Drag-and-drop step ordering |
| `drag-drop-matcher` | Terminology, component identification | Match items to categories |
| `hotspot-diagram` | Inspection, defect identification | Click on correct areas of SVG diagrams |
| `timed-scenario` | Emergency procedures, quick response | Time-pressured decision making |
| `form-validator` | Paperwork, release certificates | Fill-in form with rule validation |
| `branching-story` | Complex multi-domain case studies | Narrative with multiple endings |

#### Simulation Review Workflow

Generated simulations go through a structured review pipeline visible in the UI:

1. **Generating** → Agent cluster is actively producing the simulation
2. **Pending Review** → Simulation ready; instructor previews in sandboxed iframe
3. **Approved** → Instructor confirms quality; available for cmi5 packaging
4. **Rejected** → Simulation does not meet standards; logged for improvement
5. **Revision Requested** → Specific feedback returned; re-generation triggered

The review interface provides three tabs:
- **Preview** — Full interactive simulation in a sandboxed iframe
- **Verification** — Quality score bar, interactivity level, objectives covered/missing, accessibility notes, SME flags
- **Agent Rationale** — Full transparency: researcher recommendation, confidence score, pedagogic basis, and agent reasoning chain

### E-Learning Standards Engine

#### SCORM 1.2 Packaging

- `imsmanifest.xml` generation with proper ADL SCORM schema references
- Resource packaging with file inventory
- SCORM API wrapper (`ScormAPI`) for LMS communication: `LMSInitialize`, `LMSSetValue`, `LMSFinish`, `setComplete`, `setPassed`, `setScore`
- ZIP package generation via JSZip with DEFLATE compression

#### cmi5 / xAPI

- Full xAPI statement builder with ADL verb taxonomy: `launched`, `initialized`, `completed`, `passed`, `failed`, `terminated`
- Actor/verb/object/result statement composition per xAPI specification
- cmi5 AU (Assignable Unit) XML builder with `moveOn` criteria and `masteryScore` support
- cmi5 message bridge injected into simulation HTML for postMessage-based LMS communication
- Supabase Storage upload for packaged cmi5 content

---

### Database & Backend

**Backend**: Supabase (PostgreSQL) with Row Level Security, Storage for content packages, and real-time subscriptions.

**API Routes** (Next.js Route Handlers):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/[courseId]` | GET | Course details with modules |
| `/api/modules/[moduleId]` | GET | Module details with lessons |
| `/api/simulations/generate` | POST | Trigger simulation generation pipeline (SSE stream) |
| `/api/simulations/library` | GET | List generated simulations with optional filters |
| `/api/simulations/[id]` | GET | Full simulation record with HTML code |
| `/api/simulations/[id]` | PATCH | Update simulation status (approve/reject/revise) |
| `/api/simulations/[id]/package` | POST | Package approved simulation as cmi5 AU |
| `/api/packages/export` | POST | Export course as SCORM 1.2 ZIP |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Vanilla CSS (custom design system with tokens) | — |
| **Icons** | Lucide React | 1.14.0 |
| **Database** | Supabase (PostgreSQL) | — |
| **Auth / SSR** | @supabase/ssr | 0.10.3 |
| **AI SDK** | Vercel AI SDK (`ai`) | 6.0.177 |
| **AI Provider** | @ai-sdk/anthropic (Claude Opus 4.6 / Sonnet 4.6) | 3.0.76 |
| **Packaging** | JSZip | 3.10.1 |
| **IDs** | uuid | 14.0.0 |

---

## Project Structure

```
avilearn-app/
├── public/                         # Static assets
├── supabase/
│   └── schema.sql                  # Full database schema (all phases)
├── scripts/                        # Build & utility scripts
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with metadata
│   │   ├── globals.css             # Global styles (imports design tokens)
│   │   ├── page.tsx                # Root redirect → /dashboard
│   │   ├── (console)/              # Console route group
│   │   │   ├── layout.tsx          # Sidebar + Header shell
│   │   │   ├── dashboard/          # Instructor dashboard
│   │   │   ├── schedule/           # Flight schedule calendar
│   │   │   ├── roster/             # Student roster management
│   │   │   ├── courses/            # Course catalog & module drill-down
│   │   │   ├── simulations/        # AI simulation library
│   │   │   ├── grades/             # Grade book
│   │   │   └── chat/               # Direct messaging
│   │   ├── api/
│   │   │   ├── courses/            # Course CRUD endpoints
│   │   │   ├── modules/            # Module CRUD endpoints
│   │   │   ├── simulations/        # Simulation generation, library, CRUD
│   │   │   └── packages/           # SCORM/cmi5 export endpoints
│   │   └── simulations/            # Public simulation viewer
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Navigation sidebar with sections
│   │   │   └── Header.tsx          # Top bar with breadcrumbs
│   │   ├── simulations/
│   │   │   ├── GenerateModal.tsx   # AI pipeline trigger with SSE progress
│   │   │   ├── SimLibrary.tsx      # Simulation grid with status filters
│   │   │   └── SimPreview.tsx      # Full preview modal with review actions
│   │   └── ui/
│   │       ├── Avatar.tsx          # User avatar with initials
│   │       └── Pill.tsx            # Status badge component
│   ├── lib/
│   │   ├── config.ts              # AI model configuration (never hardcoded)
│   │   ├── agents/
│   │   │   ├── types.ts           # Agent type definitions (all phases)
│   │   │   ├── anthropic-client.ts # Anthropic model provider
│   │   │   ├── logger.ts          # Agent decision logging to Supabase
│   │   │   ├── supervisor.ts      # Content domain classifier agent
│   │   │   ├── researcher.ts      # Simulation type recommender agent
│   │   │   ├── sim-designer.ts    # HTML5 simulation code generator agent
│   │   │   ├── verifier.ts        # Quality assurance & SME gate agent
│   │   │   └── packager.ts        # cmi5 AU packager with storage upload
│   │   ├── cmi5/
│   │   │   ├── au-builder.ts      # cmi5 course structure XML builder
│   │   │   └── xapi-statements.ts # xAPI statement factory functions
│   │   ├── scorm/
│   │   │   ├── manifest-builder.ts # SCORM 1.2 imsmanifest.xml builder
│   │   │   └── zip-packager.ts    # SCORM ZIP with API wrapper
│   │   ├── supabase/              # Supabase client (server/browser)
│   │   ├── data/                  # Data access layer
│   │   │   ├── dashboard.ts       # Dashboard KPIs & widgets
│   │   │   ├── courses.ts         # Course catalog queries
│   │   │   ├── grades.ts          # Grade book queries
│   │   │   ├── roster.ts          # Student roster queries
│   │   │   └── schedule.ts        # Flight schedule queries
│   │   └── transform/
│   │       └── types.ts           # Content transformation types (Phase 3)
│   └── styles/
│       ├── tokens.css             # Design system tokens
│       └── console.css            # Console layout & component styles
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or pnpm / yarn / bun)
- A **Supabase** project with PostgreSQL database
- An **Anthropic API key** for Claude models

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd avilearn-app

# Install dependencies
npm install

# Set up environment variables (see next section)
cp .env.local.example .env.local

# Apply the database schema
# Paste the contents of supabase/schema.sql into your Supabase SQL Editor and run

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (AI Agent Cluster)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Override default models
ANTHROPIC_THINKING_MODEL=claude-opus-4-6       # For Supervisor & Verifier agents
ANTHROPIC_DOING_MODEL=claude-sonnet-4-6        # For Researcher & Sim Designer agents
```

> **Model Strategy**: The platform uses a dual-model architecture — **Claude Opus 4.6** ("thinking" model) for high-stakes classification and verification tasks, and **Claude Sonnet 4.6** ("doing" model) for research and code generation tasks. This balances quality and cost.

---

## Database Schema

The PostgreSQL schema (managed via Supabase) includes the following tables:

| Table | Phase | Description |
|-------|-------|-------------|
| `profiles` | 1 | Users with roles: `admin`, `instructor`, `student` |
| `courses` | 1 | Course records with status lifecycle (draft → active → archived) |
| `modules` | 1 | Course modules with learning objectives (text array) |
| `lessons` | 1 | Individual lessons with content types: `html`, `video`, `simulation`, `quiz`, `pptx`, `pdf` |
| `enrollments` | 1 | Student-course enrollment with status tracking |
| `flight_logs` | 1 | Flight records: aircraft, ICAO codes, duration, flight type (dual, solo, cross-country, night, instrument, checkride) |
| `grades` | 1 | Assessment records with scoring and status (pending → graded → passed/failed) |
| `scorm_packages` | 1 | SCORM 1.2 and cmi5 package records with Supabase Storage paths |
| `simulation_types` | 2 | Simulation type registry with template paths, xAPI verbs, and content domain mappings |
| `agent_logs` | 2 | Agent decision audit trail with confidence scores and timing |

---

## API Reference

### Simulation Generation (SSE Stream)

```http
POST /api/simulations/generate
Content-Type: application/json

{
  "moduleId": "uuid"
}
```

Returns a **Server-Sent Events** stream with pipeline progress:

```
data: {"step":"classifying","message":"Classifying content domain..."}

data: {"step":"researching","message":"Researching best practice for 'rca' domain..."}

data: {"step":"generating","message":"Generating ishikawa-builder simulation..."}

data: {"step":"verifying","message":"Verifying quality (score: 85/100, passed)..."}

data: {"step":"complete","message":"Simulation ready","data":{"simulationId":"uuid","simType":"ishikawa-builder","score":85}}
```

### Simulation Status Update

```http
PATCH /api/simulations/:id
Content-Type: application/json

{
  "status": "approved" | "rejected" | "revision_requested"
}
```

### SCORM Export

```http
POST /api/packages/export
Content-Type: application/json

{
  "courseId": "uuid",
  "format": "scorm_12" | "cmi5"
}
```

Returns: Binary ZIP file download

---

## Development Roadmap

### Phase 1 — Package Engine ✅ Complete

> *SCORM 1.2 and cmi5 packaging infrastructure*

- [x] SCORM 1.2 manifest builder (`imsmanifest.xml`)
- [x] SCORM API wrapper for LMS communication
- [x] ZIP package generator with DEFLATE compression
- [x] cmi5 AU XML builder with moveOn criteria
- [x] xAPI statement factory (launched, completed, passed, failed, terminated)
- [x] cmi5 message bridge for postMessage-based LMS integration
- [x] Supabase Storage integration for package uploads

### Phase 2 — Simulation Generator ✅ Core Implemented

> *AI agent cluster for autonomous simulation generation*

- [x] Agent type definitions and pipeline architecture
- [x] Supervisor Agent — content domain classifier
- [x] Researcher Agent — simulation type recommender with pedagogic rationale
- [x] Sim Designer Agent — full HTML5 simulation code generator (9 types)
- [x] Verifier Agent — quality scoring, objective coverage, SME flagging
- [x] Packager Agent — cmi5 AU wrapping and Supabase Storage upload
- [x] Agent decision logging to Supabase (`agent_logs`)
- [x] Generation Modal — SSE-streamed pipeline progress UI
- [x] Simulation Library — filterable grid with status management
- [x] Simulation Preview — sandboxed iframe with review/approve/reject workflow
- [x] AI model configuration (Opus 4.6 / Sonnet 4.6 split)
- [ ] Simulation template library (growing registry of reusable templates)
- [ ] Remotion integration for animated/complex simulations
- [ ] SME flag workflow dashboard (centralized review queue)

### Phase 3 — Immersive Content Transformation Pipeline 🔜 Planned

> *Transform existing content (PPTX, PDF, Word, video) into immersive HTML5 learning experiences*

- [ ] **Intake Agent** — parse PPTX with `python-pptx`, extract structure from PDF/Word
- [ ] **Enrichment Agent** — classify each slide/section (text-heavy, diagram, procedure, data)
- [ ] **Transformation Router** — select optimal tool chain per section:
  - `frontend-slides` → zero-dependency animated HTML5 from content
  - `HyperFrames` → HTML → MP4 video rendering
  - `video-use` → AI-driven editing of existing video footage
  - `Remotion` → data-driven programmatic video
  - Simulation Generator handoff (Phase 2) for interactive content
- [ ] **Quality Gate Agent** — pre-package validation (accuracy, WCAG, SME review)
- [ ] Light-edit interface for author text corrections
- [ ] HyperFrames Timeline Editor integration
- [ ] Unified upload → auto-transformation pipeline
- [ ] End-to-end: PPTX → HTML5 → Simulation → Video → SCORM ZIP

### Phase 4 — Hardening, Analytics & Scale 🔮 Future

> *Production readiness, LRS analytics, and self-improving simulation library*

- [ ] **LRS Analytics Dashboard** — xAPI data visualized per simulation type, learner performance
- [ ] **Self-improving template library** — reviewed simulations promoted to reusable templates
- [ ] Multi-format intake expansion (Word DOCX, scanned PDF with OCR, audio narration)
- [ ] Regression test bank — agent outputs validated against known-good aviation training examples
- [ ] Real-time METAR/TAF integration (live weather from aviation APIs)
- [ ] Student self-service portal with progress tracking
- [ ] Instructor analytics with cohort comparison
- [ ] Multi-tenant support for multiple flight schools
- [ ] CI/CD pipeline and production deployment
- [ ] Role-based access control with Supabase RLS policies

---

## Design Philosophy

### AI as Orchestrator, Human as Authority

AviLearn follows the principle that **AI agents handle all technical production** while **humans retain authority over content accuracy**:

- **Authors never write HTML, JavaScript, or video timelines** — these are agent outputs
- **Authors never choose simulation types** — the Researcher Agent proposes; the author confirms or redirects
- **The SME Review Gate is mandatory** — aviation regulatory compliance requires a qualified human to verify procedural content before export
- **Every agent decision is logged** — full audit trail with confidence scores, timing, and rationale for regulatory traceability

### Dual-Model Strategy

High-stakes cognitive tasks (classification, verification) use **Claude Opus 4.6** for maximum reasoning depth. Production tasks (research, code generation) use **Claude Sonnet 4.6** for optimal speed/quality balance. Model names are never hardcoded — they're configured in `src/lib/config.ts` and overridable via environment variables.

### Aviation-Specific Design

- Dark theme with aviation-inspired colour palette (`#0a0f1a` background, `#2dd4bf` teal accent)
- METAR weather display formatted in standard aviation notation
- Flight log tracking with ICAO codes, aircraft registrations, and flight type taxonomy
- Content domains mapped to real aviation training categories (EASA Part-66, Part 145, SMS)
- Simulation quality scoring calibrated to aviation training standards

---

## Contributing

AviLearn is currently in active development as a private project. If you're interested in contributing, please reach out to the project maintainers.

### Development Conventions

- **TypeScript strict mode** — no `any` types without justification
- **Server Components by default** — pages use `async` server components; client components are explicitly marked with `'use client'`
- **AI models via config** — never hardcode model strings; always reference `AI_CONFIG` from `src/lib/config.ts`
- **Agent logging** — every agent decision must be logged via `logAgentDecision()` for audit trail
- **CSS design tokens** — all styling uses the token system defined in `src/styles/tokens.css`

---

<p align="center">
  <sub>Built for the future of aviation training · AviLearn Engine v0.1.0</sub>
</p>
