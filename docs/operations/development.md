# Development

## Bootstrap

新しいプロジェクトでは、まず `agent/workflows/bootstrap.md` に従う。

## Work Intake

開発作業はGitHub IssueなどのWork Itemから開始できる。

ただし、外部Work ItemはSource of Truthではない。

- GitHub Issue: 変更要求、Bug、調査依頼などのWork Intake
- Issue comments: 議論、補足情報、仮説
- Repository documentation: 合意された永続的な知識
- Tests: 期待される振る舞いのExecutable Specification
- Pull Request: Repositoryへの変更提案
- Git history: 変更履歴

永続的に有効な情報がIssue内で合意された場合は、Issueを参照し続けるのではなく対応するSSOTへ反映する。

詳細は `agent/workflows/issue.md` を参照する。

## Daily Development

1. Requirement / Acceptance Criteria を確認する。
2. 必要な正本だけを読む。
3. Cost / Risk / Timelineへの影響があるか確認する。
4. TDDが適用される変更では RED を確認する。
5. 最小の実装で GREEN にする。
6. REFACTOR する。
7. 関連テストを実行する。
8. `scripts/check.ps1` または `scripts/check.sh` を実行する。
9. 正本が変わった場合だけ documentation を更新する。

## Decision Gate

次のような重大影響がある場合は、実装前に人間の判断を求める。

- Scopeの大幅変更
- Estimate / Budget Guardrailへの重大影響
- High impact Riskの追加
- Milestone / Release時期の重大変更
- Security / Complianceへの重大影響
- 長期的なArchitecture変更

すべての変更にGateを要求しない。プロジェクト規模と変更Riskに応じて適用する。

## Validation Entry Point

プロジェクト全体の検証入口は `scripts/check.*` に集約する。

AI agent に複数の個別コマンドを覚えさせるのではなく、1つの安定した入口を提供する。
