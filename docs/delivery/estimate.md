# Estimate

工数・初期費用・運用費を、前提と不確実性を含めて管理するSSOT。

見積もりはまず **Effort Range + Assumptions + Confidence** で示す。単価が与えられている場合のみCostへ変換し、不明な単価を推測しない。

## Estimate Date

2026-10-10

## Confidence

Low-Medium

## Assumptions

- Maintainer 1名を基準とする。
- 初期CLI Scopeは `init / doctor / check` に限定する。
- Repository restructuringとCLI technologyはArchitecture Gateで承認後に実装する。
- `control-plane.yml`、Project Profile、Plugin system、Subagentsは初期Scopeに含めない。
- Existing Template / Workflow / Validation assetsを再利用する。

## Delivery Effort

| Area | Range | Unit | Notes |
|---|---:|---|---|
| Product / Architecture | 1–2 | person-days | Requirements、ADR、Migration design |
| Repository migration | 1–2.5 | person-days | Template分離、既存check更新、migration verification |
| CLI implementation | 2–4 | person-days | init / doctor / check |
| QA / Verification | 1–2.5 | person-days | Unit / Integration / golden path / cross-platform |
| Documentation / Release | 0.5–1.5 | person-days | README、usage、release readiness |

## Rate

Not specified

## Initial Cost

Not calculated

## Running Cost

| Item | Monthly Range | Notes |
|---|---:|---|
| Infrastructure | 0 expected | Initial CLI does not require hosted infrastructure |
| External services | 0 expected | No required external API in MVP |
| Operations | Not calculated | Maintainer effort only |

## Contingency

Repository migrationとcross-platform distributionの不確実性があるため、Rangeで吸収する。CLI technology選定後に再見積もりする。

## Total Estimate

- Effort: 5.5–12.5 person-days
- Initial Cost: Not calculated
- Monthly Cost: 0 external infrastructure expected

## Scenario

- Lean: Repository再編を小さく保ち、runtime-based CLIで開始する。
- Expected: init / doctor / check + migration tests + Windows/Linux validation。
- High: Distribution方式やcross-platform behaviorで追加検証が必要になる。

## Change Log

| Date | Previous | Current | Reason |
|---|---:|---:|---|
| 2026-10-10 | Not estimated | 5.5–12.5 person-days | CLI MVPの初期Scopeを定義 |
