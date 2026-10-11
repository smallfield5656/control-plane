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
| M13 | REQ-011 / REQ-012を新規・既存Projectとpacked artifactで検証 | Migration / Review Gate | After M12 | Maintainer / Approver | Completed |
| M14 | REQ-013をBash / PowerShellの実補完機構とpacked artifactで検証 | Usability / Review Gate | After M12; shared ADR resolver from M13 | Maintainer / Approver | Completed |
| M15 | Windows / Linux / Node最低対応版のCI、Review、公開用artifactを確認 | Release Gate preparation | After M13 / M14 | Maintainer / Approver | Completed |
| M16 | npm更新・GitHub Release・公開artifactの照合とGolden Pathを完了 | Release Gate | After M15 and npm staged approval | Maintainer / Approver | Completed |

## Current Progress

- CLIの現在の構成は `../../ARCHITECTURE.md` を参照する。
- npm `latest` とGitHub Releaseは `0.4.0`。初期MVPの完了記録は `docs/plans/completed/cli-mvp-release-readiness.md` を参照する。
- `0.2.4` ではControl Plane製品の完成例を生成Projectから分離し、Project固有の文脈だけを配置する変更を公開した。
- Local validation、Windows / Linux CI、Review、npm publish、GitHub Release、公開artifactのGolden Path確認が成功し、`0.2.4` Release Gateは完了した。
- Template assetはroot `template/` が唯一の正本。具体的なbuild / distribution境界は `ARCHITECTURE.md`、公開手順は `docs/operations/release.md` を参照する。
- Issue #26では、placeholder推定から明示的人間承認とrevision検証へBootstrap進行contractを変更し、npm packageとGitHub ReleaseまでをM11の完了条件とする。
- `0.3.0` では明示的人間承認とrevision検証を公開し、Staged Packagesの人間承認、公開artifactのchecksum照合、Golden Path確認、GitHub Releaseを完了した。
- Issue #32 / #33の実装はPR #34でmainへMergeし、両IssueをCloseした。永続要求は `../product/requirements.md`、Scopeは `charter.md` を参照する。
- `0.4.0` でCLI承認・却下、明示移行・復旧、Bash / PowerShell補完を公開した。package versionの正本は `packages/cli/package.json`。
- ADR-0007 / ADR-0008は人間の承認を経てAcceptedとなり、Current Architectureへ反映した。Localの `scripts/check.sh` は79 tests / 79 passed（スキップなし）で成功し、Windows / Linux / Node.js 22.0.0のCIも成功した。

## v0.4.0 Release Verification

- Release commit: `1f6eaf8cb070ae17c758c5514436bdee8a8972a7`。cleanなmainからstageし、npmの人間承認後、公開metadataのgitHeadとGit tag / Releaseの対象commitが一致することを確認した。
- Review済みstageと公開npm tarballのSHA-1: `b6d8ee25effe01dd6ba968d114580011ae34237b`。npm version / latestとGitHub Release latestはいずれも `0.4.0`。
- [GitHub Release v0.4.0](https://github.com/smallfield5656/control-plane/releases/tag/v0.4.0) は正式公開済み。利用者向け変更と移行手順は `../releases/v0.4.0.md`。
- cleanな一時Directoryで公開npm versionをinstallし、version → init → doctor → next → checkと生成先の `.gitignore` を確認した。文書準備 → 上流承認 → 個別ADR採用 → Current Architecture反映 → Architecture承認 → Bootstrap Completeも成功した。
- 公開artifactのBash / PowerShell scriptを実補完機構へ登録し、item IDとADR番号の補完、候補取得がstateを変更しないことを確認した。
- 公開CLIでschema v1 / product-goalを保持した明示移行、記録なしAccepted ADRの移行、却下の同一内容no-op、上流だけを変更したADR再承認と本文維持も確認した。

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
