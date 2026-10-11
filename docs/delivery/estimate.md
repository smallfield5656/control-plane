# Estimate

Maintenance scopeの工数・費用を管理するSSOT。AI Agent Elapsed、Human Involvement、Human-only Equivalentを区別し、実測・根拠のない数値を作らない。

## Estimate Date

2026-10-11

## Confidence

Low — 今回のpatchについて、経過時間とHuman laborの実測値は収集していない。

## Assumptions

- 現在の対象はTemplate配布の完全性とRepository hygieneの修正。
- CLI commandとWorkflowのScopeは変更しない。
- npm / GitHub Releaseへの公開は、ReviewとWindows / Linux CIを確認した後に行う。
- 過去のMVP / Release Readinessは完了済み。過去の見積もりを現在の残工数として扱わない。

## Delivery Effort

| Area | AI Agent Elapsed | Human Involvement | Human-only Equivalent | Notes |
|---|---|---|---|---|
| Packaging / hygiene implementation | Not measured | Not measured | Not estimated | Regression testとRepository整理 |
| Review / CI / release | Not estimated | Not estimated | Not estimated | 公開前の残作業 |

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
- Human-only Equivalent: Not estimated
- Initial Cost: Not calculated
- Monthly Cost: Not calculated; required hosted infrastructureなし

## Main Uncertainty

Windows / Linuxでのstagingとpacked artifactの動作、公開accountの設定、Review待ち時間。公開済みnpm artifactの確認前にRelease完了とは扱わない。

過去の見積もりの変更履歴はGit、完了したRelease Readinessの成果は `docs/plans/completed/cli-mvp-release-readiness.md` を参照する。
