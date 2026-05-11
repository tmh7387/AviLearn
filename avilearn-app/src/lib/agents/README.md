# AviLearn Agent Cluster — Phase 2 Architecture

## Overview

The Agent Cluster is a **Supervisor → Specialist** multi-agent pattern built on the **OpenAI Agents SDK for TypeScript**. It powers two key systems:

1. **Simulation Generator** (Phase 2) — Given learning content, researches and generates pedagogically appropriate interactive simulations.
2. **Content Transformer** (Phase 3) — Transforms existing PPTX, PDF, Word, and video content into immersive HTML5 learning experiences.

## Agent Roles

| Agent | Responsibility | Phase |
|-------|---------------|-------|
| Supervisor | Routes by content domain, orchestrates flow | 2 |
| Researcher | Finds pedagogic best practices for domain | 2 |
| Sim Designer | Generates simulation HTML/JS code | 2 |
| Verifier | Quality review against learning objectives | 2 |
| Intake | Parses source file format, extracts structure | 3 |
| Enrichment | Classifies each slide/section by type | 3 |
| Transform Router | Selects optimal tool chain per section | 3 |
| Quality Gate | Pre-package validation (accuracy, WCAG, SME) | 3 |
| Packager | Builds cmi5 AU bundle, uploads to storage | 2, 3 |

## Implementation Status

- [x] Type definitions (`types.ts`)
- [ ] OpenAI Agents SDK installation
- [ ] Supervisor agent implementation
- [ ] Researcher agent implementation
- [ ] Sim Designer agent with template library
- [ ] Verifier agent with SME flag workflow
- [ ] Content transformation pipeline (Phase 3)

## Getting Started

```bash
npm install @openai/agents
```

See the implementation plan in `/Reference/` for full architecture details.
