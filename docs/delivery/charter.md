# Project Charter

プロジェクトの目的、Scope、関係者、投資上限を合意するためのSSOT。

## Problem

Control PlaneはTemplate / Workflow / Scriptとして利用できるが、第三者がAI-assisted developmentを継続的に進めるには、導入だけでなくRepository状態から「次に何をすべきか」を迷わず判断できる入口が必要になる。

## Expected Outcome

Control PlaneのDurable Truthを保ったまま、CLIからTemplate導入・Repository診断・次Action案内・Validation実行、人間の明示的な判断記録ができる。

## Scope

- CLI Product requirements / constraints / architecture decisionの明文化
- Repository / TemplateのSSOT分離
- TypeScript / Node.js CLI
- `init / doctor / next / check`
- `bootstrap` の `next` 互換Alias
- BootstrapからArchitecture Gate、Ongoing Developmentまでのread-only guidance
- Template assetの完全性検証
- CLIと既存Validation contractの統合
- 人間のBootstrap項目・個別ADR承認／却下と、通常開発中の再承認・置き換え（REQ-011）
- 既存Projectの明示的な移行、更新の排他・途中失敗の復旧（REQ-012）
- Bash / PowerShellのTab補完（REQ-013）。承認機能とは独立した受入対象とする。
- 上記機能のnpm配布、GitHub Release、公開artifactの検証。公開完了条件は `milestones.md` を参照する。

## Out of Scope

- `control-plane status`
- `control-plane update`
- `control-plane report`
- `control-plane estimate`
- CLIによるIssue自動作成
- 人間の明示的な判断を伴わないCLIによるADR自動承認・却下
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
- 人間が明示した判断を共通CLIで記録でき、承認済み内容の改変・不整合でGateを通過しない。
- Bash / PowerShellと配布済みnpm artifactで同じ補完候補・操作を利用できる。
- CLI導入によってTemplate / Workflow / ValidationのSSOTが二重化しない。
- Windows / Linuxの主要development environmentで利用可能である。
- Repository再編後もTemplateの完全性を自動検証できる。
- 実地利用から、`update` 等の追加機能が本当に必要か判断できる。

## Decision Gates

- Architecture Gate: Maintainer / Approverが新しい永続判断をADRで確認する。今回の提案はADR-0007 / ADR-0008に記録し、承認後にCurrent Architectureと実装へ反映する。
- Migration Gate: 既存Projectの明示的な移行・ADR照合・途中失敗の復旧が安全に検証できることを確認する。
- Release Gate: Requirementsの受入条件、cross-platform validation、packed artifact、documentationを確認する。公開手順とnpmの人間承認は `../operations/release.md` を参照する。
