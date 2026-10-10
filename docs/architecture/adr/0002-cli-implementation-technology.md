# ADR-0002: Select the CLI implementation technology after comparing cross-platform options

- Status: Proposed
- Date: 2026-10-10
- Supersedes: —

## Context

初期CLIは `init / doctor / check` を提供し、Windows / Linuxを主要対象としつつmacOSを妨げない設計にする必要がある。

CLI technologyはまだ決定していない。候補にはTypeScript / Node.js、Go、Rust、Pythonなどがある。

比較では、単なる好みではなく次を重視する。

- Cross-platform behavior
- Distribution ease
- Runtime dependency
- Startup performance
- Filesystem / process handling
- Testability
- Schema / config handling
- Package distribution
- Maintainability
- AI coding agentが扱いやすいこと
- 将来のadapter / update機構への拡張余地

## Decision

現時点ではTechnologyを確定しない。

Architecture Gateで候補比較を行い、初期MVPのRequirements / Constraintsに最も適合するTechnologyを選定する。

`control-plane.yml`、Plugin system、Subagents、Adapter systemの存在をTechnology選定の前提にしない。

## Consequences

### Positive

- TechnologyをConstraintとして先回りして固定しない。
- Distributionとcross-platform要件を踏まえて選定できる。
- CLIの実装言語とControl PlaneのProduct contractを分離できる。

### Negative / Trade-offs

- Architecture GateまではCLI scaffoldを開始できない。
- 候補比較と必要なら小さなSpikeが必要になる。

## Alternatives Considered

### TypeScript / Node.js

- 利点: CLI ecosystemが成熟、filesystem処理とtestingが容易、AI agentが扱いやすい。
- 欠点: Node runtimeまたはbundling/distribution方針が必要。

### Go

- 利点: Single binary、cross-platform distributionが容易、startupが軽い。
- 欠点: Template / Markdown中心のRepositoryでの開発ecosystemを別途持つ。

### Rust

- 利点: Single binary、性能・型安全性が高い。
- 欠点: 初期MVPに対して実装・build complexityが高くなる可能性がある。

### Python

- 利点: 実装が簡潔でfilesystem / process操作が容易。
- 欠点: runtime / packaging / Windows配布方法を考慮する必要がある。

## Validation

Architecture Gate前に、必要なら各候補について次だけを小さく確認する。

- Template directory copy
- Cross-platform process execution
- Exit-code propagation
- Distribution方法

不確実性が低ければSpikeは省略する。
