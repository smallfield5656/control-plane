# AGENTS.md

このファイルはAI coding agent向けの入口です。詳細な仕様や方針を重複して書く場所ではありません。

## Sources of Truth

- プロダクトの目的: `docs/product/overview.md`
- 要求と Acceptance Criteria: `docs/product/requirements.md`
- 制約: `docs/product/constraints.md`
- 現在のアーキテクチャ: `ARCHITECTURE.md`
- アーキテクチャ原則: `docs/architecture/principles.md`
- 設計判断の理由: `docs/architecture/adr/`
- テスト方針: `docs/testing/strategy.md`
- 開発手順: `docs/operations/development.md`
- Bootstrap: `agent/workflows/bootstrap.md`

## Core Rule: SSOT

同じ事実を複数箇所に記述しない。正本を1つ決め、それ以外からは参照する。

矛盾する情報源を見つけた場合は、実装を続ける前にどれが正本かを解決する。

## Development Workflow

振る舞いを変更する場合:

1. 関連する Requirement と Acceptance Criteria を確認する。
2. 必要なコード・テスト・Architecture・ADR を読む。
3. 期待する振る舞いをテストで定義する。
4. **RED**: 期待した理由で失敗することを確認する。
5. **GREEN**: 最小限の実装で通す。
6. **REFACTOR**: テストを緑のまま改善する。
7. 関連テストを実行する。
8. `scripts/check.*` で全体検証する。
9. 正本が変わった場合だけ durable documentation を更新する。

## Bug Fix

再現可能なバグは、修正前に regression test を追加し、失敗を確認する。

## Architecture Change

長期的な影響がある判断は、新しい ADR を追加する。過去の ADR は書き換えない。

## Completion Criteria

- Acceptance Criteria を満たしている。
- 関連テストが通る。
- 全体検証が通る。
- 必要な正本だけが更新されている。
- 一時的な作業メモが仕様化していない。
