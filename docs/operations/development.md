# Development

## Bootstrap

新しいプロジェクトでは、まず `agent/workflows/bootstrap.md` に従う。

## Daily Development

1. Requirement / Acceptance Criteria を確認する。
2. 必要な正本だけを読む。
3. TDDが適用される変更では RED を確認する。
4. 最小の実装で GREEN にする。
5. REFACTOR する。
6. 関連テストを実行する。
7. `scripts/check.ps1` または `scripts/check.sh` を実行する。
8. 正本が変わった場合だけ documentation を更新する。

## Validation Entry Point

プロジェクト全体の検証入口は `scripts/check.*` に集約する。

AI agent に複数の個別コマンドを覚えさせるのではなく、1つの安定した入口を提供する。
