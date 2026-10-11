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
| M11 | 明示的人間承認によるBootstrap進行をnpm / GitHub Releaseへ公開 | Architecture / Release Gate | After Issue #26 review | Maintainer / Approver | Completed |
| M12 | 承認操作・安全な更新・補完の設計をADR-0007 / ADR-0008で採用 | Architecture Gate | After requirements / impact review | Maintainer / Approver | Completed |
| M13 | REQ-011 / REQ-012を新規・既存Projectとpacked artifactで検証 | Migration / Review Gate | After M12 | Maintainer / Approver | Local validation; pending CI / Review |
| M14 | REQ-013をBash / PowerShellの実補完機構とpacked artifactで検証 | Usability / Review Gate | After M12; shared ADR resolver from M13 | Maintainer / Approver | Local validation; pending CI / Review |
| M15 | Windows / Linux / Node最低対応版のCI、Review、公開用artifactを確認 | Release Gate preparation | After M13 / M14 | Maintainer / Approver | In progress |
| M16 | npm更新・GitHub Release・公開artifactの照合とGolden Pathを完了 | Release Gate | After M15 and npm staged approval | Maintainer / Approver | Not started |

## Current Progress

- CLIの現在の構成は `../../ARCHITECTURE.md` を参照する。
- npm `latest` とGitHub Releaseは `0.3.0`。初期MVPの完了記録は `docs/plans/completed/cli-mvp-release-readiness.md` を参照する。
- `0.2.4` ではControl Plane製品の完成例を生成Projectから分離し、Project固有の文脈だけを配置する変更を公開した。
- Local validation、Windows / Linux CI、Review、npm publish、GitHub Release、公開artifactのGolden Path確認が成功し、`0.2.4` Release Gateは完了した。
- Template assetはroot `template/` が唯一の正本。具体的なbuild / distribution境界は `ARCHITECTURE.md`、公開手順は `docs/operations/release.md` を参照する。
- Issue #26では、placeholder推定から明示的人間承認とrevision検証へBootstrap進行contractを変更し、npm packageとGitHub ReleaseまでをM11の完了条件とする。
- `0.3.0` では明示的人間承認とrevision検証を公開し、Staged Packagesの人間承認、公開artifactのchecksum照合、Golden Path確認、GitHub Releaseを完了した。
- 次Releaseの目標は、CLI承認・却下とBash / PowerShell補完を配布し、npmとGitHub Releaseの両方を完了すること。Issue #32 / #33はWork Intakeとして受け付け、永続要求は `../product/requirements.md`、Scopeは `charter.md` へ反映した。
- Release候補は `0.4.0`。新しいCLI操作・state移行を含むminor更新として公開準備中。package versionの正本は `packages/cli/package.json`。
- ADR-0007 / ADR-0008は人間の承認を経てAcceptedとなり、Current Architectureへ反映した。Localの `scripts/check.sh` は78 tests / 78 passed（BashとPowerShellの実補完、packed artifactを含む）で成功した。CIと公開準備を進めている。公開完了はM16で別途確認する。

## Current Release Completion Gate

M16は次をすべて満たしてからCompletedとする。公開操作と照合方法の正本は `../operations/release.md`。

- 承認操作・移行・復旧と補完がそれぞれのAcceptance Criteriaを満たす。
- 関連テスト、Localの `scripts/check.*`、Windows / Linuxと最低Node対応版のCI、Reviewが成功する。
- cleanなrelease commitのartifactをnpmへstageし、人間が同じstageをApproveする。
- 公開npm versionとdist-tagを確認し、公開tarballのchecksumがレビューしたstageと一致する。
- 同じrelease commitを指すGit tagとGitHub Releaseを作成し、利用者への変更・移行手順をRelease notesに含める。
- clean Directoryで公開versionの既存Golden Pathと新機能・補完assetを確認する。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
- 次PhaseではRelease ReadinessのScopeを再利用せず、新しいGoal / Gateを定義する。
