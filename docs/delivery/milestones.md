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

- `control-plane init / doctor / check` は実装・validation完了しmainへmerge済み。
- npm packageは `@smallfield5656/control-plane@0.1.0` としてpublic publish済み。
- CLI bin名は `control-plane`、Node.js support baselineは `>=22`。
- root `template/` を唯一のSource of Truthとし、`npm pack` 時だけpackage artifactへstagingする。
- packed tarball Golden PathとGitHub ActionsのUbuntu / Windows validationは成功済み。
- 公開npm packageをclean GitHub Actions runnerから `--version → init → doctor → check` までdogfoodし成功済み。
- `v0.1.0` Git tagはrelease対象commit `c46c1c6693f735388a4b30b0033f72aed6a8e8b6` を指す。
- GitHub Release `control-plane v0.1.0` を公開済み。
- CLI MVP Release Readinessは完了し、Planは `docs/plans/completed/cli-mvp-release-readiness.md` へ移動する。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
- 次PhaseではRelease ReadinessのScopeを再利用せず、新しいGoal / Gateを定義する。
