# Project Charter

プロジェクトの目的、Scope、関係者、投資上限を合意するためのSSOT。

## Problem

Control PlaneはTemplate / Workflow / Scriptとして利用できるが、第三者がAI-assisted developmentを継続的に進めるには、導入だけでなくRepository状態から「次に何をすべきか」を迷わず判断できる入口が必要になる。

## Expected Outcome

Control PlaneのDurable Truthを保ったまま、CLIからTemplate導入・Repository診断・次Action案内・Validation実行ができる。

## Scope

- CLI Product requirements / constraints / architecture decisionの明文化
- Repository / TemplateのSSOT分離
- TypeScript / Node.js CLI
- `init / doctor / next / check`
- `bootstrap` の `next` 互換Alias
- BootstrapからArchitecture Gate、Ongoing Developmentまでのread-only guidance
- Template assetの完全性検証
- CLIと既存Validation contractの統合

## Out of Scope

- `control-plane status`
- `control-plane update`
- `control-plane report`
- `control-plane estimate`
- CLIによるIssue自動作成
- CLIによるADR自動承認・却下
- `control-plane.yml` の必須化
- Project Profile
- Plugin system / Subagents / Agent runtime
- Remote SaaS / hosted backend

## Stakeholders

- DRI: Repository maintainer
- Approver: Repository owner
- Consulted: Control Planeを利用するEngineer / AI coding agentによる実地検証

## Budget Guardrail

- Initial cost ceiling: Not specified
- Monthly running cost ceiling: 常時稼働Infrastructureを要求しない

## Timeline Guardrail

固定期限より、Architecture Gateと小さなVertical Sliceを優先する。

## Success Metrics

- `init / doctor / next / check` が第三者でも利用できる。
- `next` がBootstrap中からOngoing Developmentまで次Actionを案内できる。
- CLI導入によってTemplate / Workflow / ValidationのSSOTが二重化しない。
- Windows / Linuxの主要development environmentで利用可能である。
- Repository再編後もTemplateの完全性を自動検証できる。
- 実地利用から、`update` 等の追加機能が本当に必要か判断できる。

## Decision Gates

- Architecture Gate: Repository / Template structure と CLI technology を承認する。
- Migration Gate: 既存Template assetの移動が安全に検証できることを確認する。
- Release Gate: `init / doctor / next / check` のcontract、cross-platform validation、documentationを確認する。
