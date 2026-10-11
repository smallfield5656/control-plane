# Estimate

Maintenance scopeの工数・費用を管理するSSOT。AI Agent Elapsed、Human Involvement、Human-only Equivalentを区別し、実測・根拠のない数値を作らない。

## Estimate Date

2026-10-11

## Confidence

Low — 記載工数は実装前の参考見積もりで、実装時間・人間の関与時間は未実測。完了したScopeを現在の残工数として扱わない。完了状況は `milestones.md` を参照する。

## Assumptions

- 今回のScopeは `charter.md`、受入条件は `../product/requirements.md` を正本とする。
- 新しい永続判断はADR-0007 / ADR-0008でレビューし、Architecture Gateの後に実装した。
- 既存TypeScript / Node.jsと標準libraryを維持し、実行時依存やhosted infrastructureを追加しなかった。
- npm / GitHub Releaseへの公開は、ReviewとWindows / Linux CIを確認した後に行う。
- 過去のMVP / Release Readinessは完了済み。過去の見積もりを現在の残工数として扱わない。

## Delivery Effort

| Area | AI Agent Elapsed | Human Involvement | Human-only Equivalent | Notes |
|---|---|---|---|---|
| Item / ADR operations and migration | Not measured | Not estimated | 2–4 person-days | schema・既存互換・番号解決・本文/lifecycle照合・adapter・Gate案内 |
| Lock / crash recovery | Not measured | Not estimated | 1–2 person-days | 複数file更新と外部編集を含むfailure injection |
| Bash / PowerShell completion | Not measured | Not estimated | 1–2 person-days | 共通候補取得・shell実機・空白path・packed artifact |
| Review / CI / release | Not measured | Not estimated | 0.5–1 person-day | 最低Node対応版・Windows/Linux・stage・公開物のGolden Path |

Human-only Equivalentは同じ受入条件を熟知したEngineer 1名が1日8時間で実装・テスト・文書更新する参考rangeで、実測や納期保証ではない。CI、レビュー、npmの人間承認の待ち時間は含めない。AIの経過時間や人間の関与時間への換算は行わない。

AI Agent ElapsedとHuman Involvementは単純合算しない。Human-only Equivalentを算出する場合は、同じScopeと品質条件で前提を明示する。

## Rate

Not specified

## Initial Cost

Not calculated

## Running Cost

| Item | Monthly Range | Notes |
|---|---|---|
| Infrastructure | No required hosted infrastructure | CLIはlocal filesystemで動作 |
| AI / External services | Not calculated | 開発時の利用量・契約条件は未集計 |
| Operations | Not calculated | Maintainer effortの実測なし |

## Total Estimate

- AI Agent Elapsed: Not measured
- Human Involvement: Not measured
- Human-only Equivalent: 4.5–9 person-days（参考見積もり、Low confidence）
- Initial Cost: Not calculated
- Monthly Cost: Not calculated; required hosted infrastructureなし

## Main Uncertainty

実装前の主な不確実性は、Windows / Linuxでのfile置換・ロック、途中失敗の復旧、PowerShellの実補完、packed artifact、Reviewとnpmの人間承認待ちだった。これらの検証と公開Gateは完了したが、実測工数・費用や効果量は未集計。将来のMaintenance工数へこの参考rangeを転用しない。

過去の見積もりの変更履歴はGit、完了したRelease Readinessの成果は `docs/plans/completed/cli-mvp-release-readiness.md` を参照する。
