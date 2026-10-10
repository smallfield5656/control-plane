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
| M9 | Third-party Quick Start / clean-environment dogfood | Usability Gate | After M8 | Maintainer / Tester | In Progress |
| M10 | v0.1.0 publish / GitHub Release | Release Gate | After M9 | Maintainer / Approver | Planned |

## Current Progress

- `control-plane init / doctor / check` は実装・validation完了しmainへmerge済み。
- npm package identityは `control-plane@0.1.0`、Node.js support baselineは `>=22` として実装済み。
- root `template/` を唯一のSource of Truthとし、`npm pack` 時だけpackage artifactへstagingする方式を実装済み。
- packed tarballを一時consumerへinstallし、`init → doctor → check → --version / --help` を実行するGolden Path testを追加済み。
- GitHub ActionsでUbuntu / Windowsの双方が成功し、packed artifact Golden Pathを含む13 testsが通過済み。
- READMEは公開後の `npx control-plane init my-app` を先頭Golden Pathとして更新済み。
- 残るRelease blockerはnpm registryへの実publishと、published packageからの最終dogfood。
- npm publishにはnpm account authorizationが必要なため、Repository側だけでは完了できない。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
- Release Readiness中は `bootstrap / status / update` へScopeを広げない。
