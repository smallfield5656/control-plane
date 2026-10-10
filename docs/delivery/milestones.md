# Milestones

主要な成果物、Decision Gate、期限を管理するSSOT。

## Milestone Plan

| Milestone | Outcome / Deliverable | Decision Gate | Target | Owner | Status |
|---|---|---|---|---|---|
| M1 | CLI Product Goal / Requirements / Constraints / Delivery整理 | Architecture Gate preparation | No fixed date | Maintainer | Completed |
| M2 | Repository / Template structure と CLI technology をADRで決定 | Architecture Gate | After M1 | Maintainer / Approver | Completed |
| M3 | Template asset migration + regression validation | Migration Gate | After M2 | Maintainer | Completed |
| M4 | `control-plane init` vertical slice | Review | After M3 | Maintainer | Completed |
| M5 | `control-plane doctor` / `check` | Review | After M4 | Maintainer | In Progress |
| M6 | Windows / Linux validation、documentation、CLI MVP release readiness | Release Gate | After M5 | Maintainer / Approver | Planned |

## Current Progress

- `control-plane doctor [directory]` は実装・validation完了しmainへmerge済み。
- `control-plane check [directory]` は実装済みで、PR validation待ち。
- M5は `check` のvalidation完了まで `In Progress` とする。

## Rules

- ActivityではなくOutcome / Deliverableを中心に書く。
- Gateを置く場合は「誰が何を判断するか」を明確にする。
- 期限変更時は、Cost / Riskへの影響も必要に応じて `estimate.md` / `risks.md` へ反映する。
