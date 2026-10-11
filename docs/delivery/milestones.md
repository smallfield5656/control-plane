# Milestones

主要な成果物、Decision Gate、期限を管理するSSOT。

## Milestone Plan

| Milestone | Outcome / Deliverable | Decision Gate | Target | Owner | Status |
|---|---|---|---|---|---|
| M1 | CLI Product Goal / Requirements / Constraints / Delivery整理 | Architecture Gate preparation | No fixed date | Maintainer | Completed |
| M2 | Repository / Template structure と CLI technology をADRで決定 | Architecture Gate | After M1 | Maintainer / Approver | Completed |
| M3 | Template asset migration + regression validation | Migration Gate | After M2 | Maintainer | Completed |
| M4 | `control-plane init` vertical slice | Review | After M3 | Maintainer | Completed |
| M5 | `control-plane doctor` / `check` | Review | After M4 | Maintainer | Completed |
| M6 | npm package contract + Template packaging | Package Gate | After M5 | Maintainer / Approver | Completed |
| M7 | packed artifact integration test + CLI UX baseline | Review | After M6 | Maintainer | Completed |
| M8 | Windows / Linux CI | CI Gate | After M7 | Maintainer | Completed |
| M9 | Third-party Quick Start / clean-environment dogfood | Usability Gate | After M8 | Maintainer / Tester | Completed |
| M10 | v0.1.0 publish / GitHub Release | Release Gate | After M9 | Maintainer / Approver | Completed |

## Current Progress

- CLIは `init / doctor / next / check` と `bootstrap` 互換Aliasを提供する。
- 確認時点のnpm `latest` とGitHub Releaseは `0.2.2`。初期MVPの完了記録は `docs/plans/completed/cli-mvp-release-readiness.md` を参照する。
- 次のpatch `0.2.3` を準備する。対象は独立したplaceholderの検出修正、全CLI commandの端末表示改善、共通の色無効化指定。
- Local validation、Windows / Linux CI、Review、npm publish、GitHub Release、公開artifactのdogfoodがRelease Gate。公開状態は未完了。
- Template assetはroot `template/` が唯一の正本。具体的なbuild / distribution境界は `ARCHITECTURE.md`、公開手順は `docs/operations/release.md` を参照する。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
- 次PhaseではRelease ReadinessのScopeを再利用せず、新しいGoal / Gateを定義する。
