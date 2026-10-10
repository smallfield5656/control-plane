# Product Overview

## Problem

`control-plane` は、AI coding agent を使った開発で、人間の意図・制約・判断・品質基準が実装速度に埋もれず、Repository上の durable truth として維持されるための開発制御基盤です。

現在はTemplate、Workflow、ADR、Testing Strategy、Validation Scriptを中心に提供していますが、導入・診断・検証の操作が手作業に寄っており、第三者が同じ流れを再現するにはRepository構造と文書を理解する必要があります。

## Users

- AI coding agent を用いて個人または小規模チームでSoftwareを開発するEngineer
- AIが実装しても、人間がArchitecture / Risk / Deliveryを制御したいTechnical Lead
- `control-plane` Templateを新規Projectへ導入・保守するMaintainer

## Goals

- Requirements / Constraints / Delivery / Architecture / ValidationをRepository上のSSOTとして維持する。
- AI agentが重要Decision Gateを越えて勝手に実装へ進まない開発フローを提供する。
- 新規ProjectへのTemplate導入・Repository診断・共通ValidationをCLIから再現可能にする。
- CLIを薄いInterfaceとして保ち、Template / Workflow / Validation logicとの二重管理を避ける。
- Cross-platformで利用でき、特定AI vendorへSSOTを依存させない。

## Non-Goals

- CLIをAgent runtimeや完全なHarnessそのものにすること。
- Bootstrapの判断ロジックをCLIへ大量にhard-codeすること。
- 初期CLIでPlugin system、Subagents、Project Profile、Adapter systemを実装すること。
- 初期CLIで `control-plane.yml` を必須化すること。
- すべてのProjectへ同じProcess量を強制すること。

## Success Criteria

- `control-plane init <directory>` でTemplateを新規Projectへ展開できる。
- `control-plane doctor` がRepositoryの不足とBootstrap状態を人間向けに説明できる。
- `control-plane check` が既存の `scripts/check.*` を再実装せず実行できる。
- Template / CLI / Workflowの変更が同一Repositoryで検証できる。
- CLI導入後も `Complexity must be earned`、SSOT、Decision Gate、Technology-neutral validationの原則が維持される。
