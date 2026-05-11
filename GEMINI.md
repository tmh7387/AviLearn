# Agent Instructions

You operate within the CORE 4-Level Architecture. Global rules are defined in the system-level GEMINI.md. This file contains project-specific context, goals, and constraints.

## Architecture

**Level 1: Command (GEMINI.md)** — project brain, goals, principles
**Level 2: Operations (/ops/)** — SOPs and workflow playbooks (Markdown)
**Level 3: Resources (/resources/)** — Python scripts and reusable tools
**Level 4: Environment (/env/)** — config, secrets, logs, temp files

**Specialist layer (.agent/)** — Antigravity Kit agents, skills, and slash-command workflows. Active on all tasks. GEMINI.md rules take precedence over .agent/ rules in any conflict.

## Project Context

[FILL IN: Project name, purpose, and primary goals]
[FILL IN: Key technologies and stack]
[FILL IN: Any domain-specific constraints or conventions]

## Operating Principles

1. **Check resources/ first** — before writing a new script, confirm no existing tool covers it.
2. **Self-anneal** — read errors fully, fix and retest, then update the relevant /ops/ SOP.
3. **Living ops** — update /ops/ documents as you learn. Do not overwrite without asking unless explicitly told to.
4. **Signal completion** — run `python resources/play_chime.py` when returning control after significant processing.

## File Organization

- `env/tmp/` — intermediates (never commit, always regenerable)
- `env/logs/` — logs and outputs
- `resources/` — Python scripts
- `ops/` — SOPs and workflow guides
- `env/` — config and credentials
- `.agent/` — Antigravity Kit layer (local only, not committed)

**Deliverables live in cloud services. Local files are for processing only.**
