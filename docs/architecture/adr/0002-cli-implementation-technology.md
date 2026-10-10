# ADR-0002: Use TypeScript / Node.js for the initial CLI

- Status: Accepted
- Date: 2026-10-10
- Supersedes: —

## Context

Initial CLI must support `init / doctor / check`, target Windows and Linux, manipulate files safely, execute validation processes, and remain easy to test and maintain.

## Decision

Use TypeScript on Node.js for the initial CLI implementation.

The first package lives under `packages/cli/`. Keep dependencies minimal and prefer Node standard library for filesystem/process behavior. Do not introduce a monorepo framework, plugin framework, `control-plane.yml`, or adapter system until a repeated need is demonstrated.

## Consequences

### Positive

- Mature cross-platform filesystem/process APIs.
- Strong testability and fast implementation iteration.
- Easy fit with JSON/schema work expected later.
- Familiar environment for AI coding agents and a broad contributor base.

### Negative / Trade-offs

- Initial distribution depends on Node.js unless a later packaging decision introduces bundling or a standalone executable.
- npm packaging must eventually include the canonical `template/` asset without duplicating its source of truth.

## Alternatives Considered

### Go

Single-binary distribution is attractive, but the initial MVP values iteration speed and repository integration more highly.

### Rust

Strong binary distribution and safety, but excessive implementation/build complexity for the current scope.

### Python

Simple filesystem code, but runtime/packaging consistency on Windows is less attractive for this CLI.

## Validation

The first Vertical Slice must prove that TypeScript / Node.js can safely copy the canonical Template, reject destructive target collisions, and support automated tests on the target platforms.
