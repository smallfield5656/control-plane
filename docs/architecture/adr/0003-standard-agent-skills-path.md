# ADR-0003: Use .agents/skills for standard Agent Skills

- Status: Accepted
- Date: 2026-10-11
- Supersedes: —

## Context

Control Plane originally grouped both reusable Agent Skills and Control Plane-specific workflows under `agent/`. As Agent Skills conventions matured, `.agents/skills/<skill>/SKILL.md` became the neutral repository-local location for standard Agent Skills.

Keeping standard Skills under `agent/skills/` would preserve a Control Plane-specific path without providing a meaningful architectural benefit, and would make direct interoperability with tools that discover `.agents/skills/` less natural.

Control Plane workflows are a separate concept: they define project-specific development flow and are not part of the Agent Skills directory convention.

## Decision

Place reusable standard Agent Skills under `.agents/skills/`.

Keep Control Plane-specific workflows under `agent/workflows/`.

Treat Skills as adapters that help an agent execute repository workflows and durable contracts. Skills must not become a duplicate Source of Truth for workflow or project decisions.

## Consequences

### Positive

- Aligns repository-local Skills with a neutral Agent Skills convention.
- Improves portability across compatible AI coding agents.
- Makes the boundary between reusable Skills and Control Plane-specific workflows explicit.
- Avoids vendor-specific `.claude/` or `.codex/` paths as the canonical location.

### Negative / Trade-offs

- Existing references to `agent/skills/` must be migrated.
- Projects generated from older Control Plane versions keep their existing paths unless changed explicitly; Control Plane does not introduce an automatic update mechanism for this migration.

## Alternatives Considered

### Keep `agent/skills/`

This keeps all agent-facing assets under one directory, but preserves a custom path for a concept that already has a neutral convention.

### Move both Skills and Workflows under `.agents/`

This would make the tree visually uniform, but would imply that Control Plane-specific workflows are part of the Agent Skills convention. They are intentionally separate concepts.

### Use vendor-specific directories

Rejected because Control Plane remains vendor-neutral and repository-first.

## Validation

- Product and generated Template place `project-bootstrap` and `tdd` under `.agents/skills/`.
- `agent/workflows/` remains unchanged.
- Validation scripts require the new path.
- CLI Template tests verify that generated projects contain the new Skills and not the legacy `agent/skills/project-bootstrap/SKILL.md` path.
