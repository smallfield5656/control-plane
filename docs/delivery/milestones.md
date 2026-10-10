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
| M6 | npm package contract + Template packaging | Package Gate | After M5 | Maintainer / Approver | Planned |
| M7 | packed artifact integration test + CLI UX baseline | Review | After M6 | Maintainer | Planned |
| M8 | Windows / Linux CI | CI Gate | After M7 | Maintainer | Planned |
| M9 | Third-party Quick Start / clean-environment dogfood | Usability Gate | After M8 | Maintainer / Tester | Planned |
| M10 | v0.1.0 publish / GitHub Release | Release Gate | After M9 | Maintainer / Approver | Planned |

## Current Progress

- `control-plane init <directory>` は実装・validation完了しmainへmerge済み。
- `control-plane doctor [directory]` は実装・validation完了しmainへmerge済み。
- `control-plane check [directory]` は実装・validation完了しmainへmerge済み。
- 初期CLI MVP command implementationは完了した。
- 次Phaseは `docs/plans/active/cli-mvp-release-readiness.md` に従い、配布可能なnpm packageへ段階的に移行する。
- 最初のRelease Readiness Sliceは package contract と Template packaging。`npm pack` したartifactから `init` が成功するところまでを対象とする。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
- Release Readiness中は `bootstrap / status / update` へScopeを広げない。
