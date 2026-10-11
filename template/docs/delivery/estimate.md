# Estimate

工数・初期費用・運用費を、前提と不確実性を含めて管理するSSOT。

見積もりはまず **Effort Range + Assumptions + Confidence** で示す。単価が与えられている場合のみCostへ変換し、不明な単価を推測しない。

AI Agentと協働するProjectでは、**AI Agent Elapsed**、**Human Involvement**、**Human-only Equivalent** を分けて記録する。

- **AI Agent Elapsed**: AI Agentが分析・生成・検証などに要する経過時間。人間の拘束時間ではない。
- **Human Involvement**: 壁打ち、判断、レビュー、承認、修正指示など、人間が実際に関与する時間。
- **Human-only Equivalent**: 同じScopeをAI Agentなしで人間だけが実施した場合の推定工数。比較用の反実仮想Estimateであり、根拠とConfidenceを明記する。

AI Agent ElapsedとHuman Involvementは性質が異なるため、**単純合算しない**。必要ならCalendar ElapsedやCostは別途Scenarioとして示す。

## Estimate Date

TODO: YYYY-MM-DD

## Confidence

TODO: Low / Medium / High

## Assumptions

- TODO: Team size、対象Platform、既存資産、外部Service利用量、既知の制約など
- TODO: AI Agentの利用範囲、Human Reviewの粒度、Human-only Equivalentの根拠

## Delivery Effort

| Area | AI Agent Elapsed | Human Involvement | Human-only Equivalent | Unit | Notes |
|---|---:|---:|---:|---|---|
| Engineering | TODO | TODO | TODO | hours / days | |
| QA / Verification | TODO | TODO | TODO | hours / days | |
| PM / Coordination | TODO | TODO | TODO | hours / days | |
| Security / Review | TODO | TODO | TODO | hours / days | |

## Effort Interpretation

- AI-assisted scenarioは `AI Agent Elapsed` と `Human Involvement` を別々に読む。
- Human-only scenarioは `Human-only Equivalent` を比較基準として読む。
- Human-only Equivalentは実測値でない場合があるため、AssumptionsとConfidenceを必ず併記する。
- AI Agent ElapsedとHuman Involvementを総工数として単純合算しない。
- Calendar Elapsed、並列実行、待ち時間、Review latencyが重要な場合はScenarioで明示する。

## Rate

TODO: 単価が分かる場合のみ記載。不明なら `Not specified` とする。

AI利用料とHuman labor rateをCostへ変換する場合は、別々のRateとして扱う。単価が不明な場合は推測しない。

## Initial Cost

TODO: Rateが分かる場合のみ算出。不明なら `Not calculated` とする。

## Running Cost

| Item | Monthly Range | Notes |
|---|---:|---|
| Infrastructure | TODO | |
| AI / External services | TODO | |
| Operations | TODO | |

## Contingency

TODO: 必要な場合のみ設定。不確実性が高い場合は理由も記載する。

## Total Estimate

- AI Agent Elapsed: TODO
- Human Involvement: TODO
- Human-only Equivalent: TODO
- Initial Cost: TODO
- Monthly Cost: TODO

## Scenario

必要に応じて Lean / Expected / High など複数Scenarioを示す。

AI-assistedとHuman-onlyを比較する場合は、Scopeと品質条件を揃え、異なる前提で見かけ上の効率差を作らない。

## Change Log

見積もりが大きく変わった場合、数値だけでなく前提・Scope・Riskのどれが変わったかを残す。

| Date | Previous | Current | Reason |
|---|---:|---:|---|
