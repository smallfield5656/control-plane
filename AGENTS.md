# AGENTS.md

このファイルはAI coding agent向けの入口です。詳細な仕様や方針を重複して書く場所ではありません。

## Sources of Truth

- プロダクトの目的: `docs/product/overview.md`
- 要求と Acceptance Criteria: `docs/product/requirements.md`
- 制約: `docs/product/constraints.md`
- Delivery / Scope / Estimate / Risks / Milestones: `docs/delivery/`
- 現在のアーキテクチャ: `ARCHITECTURE.md`
- アーキテクチャ原則: `docs/architecture/principles.md`
- 設計判断の理由: `docs/architecture/adr/`
- テスト方針: `docs/testing/strategy.md`
- 開発手順: `docs/operations/development.md`
- Bootstrap: `agent/workflows/bootstrap.md`
- Issue intake: `agent/workflows/issue.md`

## Core Rule: SSOT

同じ事実を複数箇所に記述しない。正本を1つ決め、それ以外からは参照する。

矛盾する情報源を見つけた場合は、実装を続ける前にどれが正本かを解決する。

## Work Intake

GitHub Issue等から作業を開始する場合は `agent/workflows/issue.md` に従う。

IssueはWork Intakeであり、永続的なSource of Truthではない。Issue内で合意された永続情報は、対応するRepository上の正本へ反映する。

## Development Workflow

振る舞いを変更する場合:

1. 関連する Requirement と Acceptance Criteria を確認する。
2. 必要なコード・テスト・Architecture・ADR・Delivery情報を読む。
3. Cost / Risk / Timelineへの影響が大きい場合は、実装前にDecision Gateを設ける。
4. 期待する振る舞いをテストで定義する。
5. **RED**: 期待した理由で失敗することを確認する。
6. **GREEN**: 最小限の実装で通す。
7. **REFACTOR**: テストを緑のまま改善する。
8. 関連テストを実行する。
9. `scripts/check.*` で全体検証する。
10. 正本が変わった場合だけ durable documentation を更新する。

## Bug Fix

再現可能なバグは、修正前に regression test を追加し、失敗を確認する。

## Architecture Change

長期的な影響がある判断は、新しい ADR を追加する。過去の ADR は書き換えない。

## Completion Criteria

- Acceptance Criteria を満たしている。
- 関連テストが通る。
- 全体検証が通る。
- 必要な正本だけが更新されている。
- Cost / Risk / Timelineへの影響が必要に応じて反映されている。
- 一時的な作業メモやIssueコメントが仕様化していない。
