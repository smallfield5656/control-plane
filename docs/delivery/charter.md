# Project Charter

プロジェクトの目的、Scope、関係者、投資上限を合意するためのSSOT。

## Problem

現在のControl PlaneはTemplate / Workflow / Scriptとして利用できるが、第三者が導入・診断・検証するにはRepository構造と手順を理解する必要があり、再現性とUXに課題がある。

## Expected Outcome

Control PlaneのDurable Truthを保ったまま、CLIからTemplate導入・Repository診断・Validation実行ができる。

## Scope

- CLI Product requirements / constraints / architecture decisionの明文化
- Repository再編方針の決定
- CLI technologyの選定
- 初期CLI: `init / doctor / check`
- Template assetの移行と完全性検証
- CLIと既存Validation contractの統合

## Out of Scope

- `control-plane bootstrap`
- `control-plane status`
- `control-plane update`
- `control-plane report`
- `control-plane estimate`
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

- `init / doctor / check` が第三者でも説明なしに利用できる。
- CLI導入によってTemplate / Workflow / ValidationのSSOTが二重化しない。
- Windows / Linuxの主要development environmentで利用可能な設計になる。
- Repository再編後もTemplateの完全性を自動検証できる。
- 初期MVP後の実地利用から、次の機能追加判断ができる。

## Decision Gates

- Architecture Gate: Repository / Template structure と CLI technology を承認する。
- Migration Gate: 既存Template assetの移動が安全に検証できることを確認する。
- Release Gate: `init / doctor / check` のcontract、cross-platform validation、documentationを確認する。
