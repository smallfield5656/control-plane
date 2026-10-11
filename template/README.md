# control-plane

このRepositoryは、AIエージェント前提の開発を始めるためのControl Plane Templateです。

## Start

1. `AGENTS.md` をAI agentの入口として使う。
2. `agent/workflows/bootstrap.md` に従ってProduct Goal / Requirements / Constraints / Deliveryを整理する。
3. 重要なArchitecture decisionはADRを `Proposed` としてArchitecture Gateで承認する。
4. 承認後にScaffoldし、`scripts/check.*` を共通Validation Entry Pointとして使う。

Bootstrap後、このREADMEはProject固有のPurpose / Setup / Run / Validationへの入口へ置き換えてください。

## Agent Assets

- Standard Agent Skills: `.agents/skills/`
- Control Plane workflows: `agent/workflows/`

SkillはWorkflowやDurable Truthを複製せず、それらを実行するためのAdapterとして扱います。

## Sources of Truth

- Product: `docs/product/`
- Delivery: `docs/delivery/`
- Current Architecture: `ARCHITECTURE.md`
- ADR: `docs/architecture/adr/`
- Testing: `docs/testing/strategy.md`
- Development: `docs/operations/development.md`
- Agent Skills: `.agents/skills/`
- Agent workflows: `agent/workflows/`

## Principles

- One fact, one authoritative location.
- Requirements / Constraints before Technology.
- Complexity must be earned.
- Behavior changes use RED → GREEN → REFACTOR where appropriate.
- External work items are intake; Repository is durable truth.
- Project-specific validation belongs behind `scripts/check-project.*`.
