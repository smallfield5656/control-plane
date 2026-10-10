# Estimate

工数・初期費用・運用費を、前提と不確実性を含めて管理するSSOT。

見積もりはまず **Effort Range + Assumptions + Confidence** で示す。単価が与えられている場合のみCostへ変換し、不明な単価を推測しない。

## Estimate Date

TODO: YYYY-MM-DD

## Confidence

TODO: Low / Medium / High

## Assumptions

- TODO: Team size、対象Platform、既存資産、外部Service利用量、既知の制約など

## Delivery Effort

| Area | Range | Unit | Notes |
|---|---:|---|---|
| Engineering | TODO | person-hours / person-days | |
| QA / Verification | TODO | person-hours / person-days | |
| PM / Coordination | TODO | person-hours / person-days | |
| Security / Review | TODO | person-hours / person-days | |

## Rate

TODO: 単価が分かる場合のみ記載。不明なら `Not specified` とする。

## Initial Cost

TODO: Rateが分かる場合のみ算出。不明なら `Not calculated` とする。

## Running Cost

| Item | Monthly Range | Notes |
|---|---:|---|
| Infrastructure | TODO | |
| External services | TODO | |
| Operations | TODO | |

## Contingency

TODO: 必要な場合のみ設定。不確実性が高い場合は理由も記載する。

## Total Estimate

- Effort: TODO
- Initial Cost: TODO
- Monthly Cost: TODO

## Scenario

必要に応じて Lean / Expected / High など複数Scenarioを示す。

## Change Log

見積もりが大きく変わった場合、数値だけでなく前提・Scope・Riskのどれが変わったかを残す。

| Date | Previous | Current | Reason |
|---|---:|---:|---|
