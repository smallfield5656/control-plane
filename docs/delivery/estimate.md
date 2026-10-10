# Estimate

工数・初期費用・運用費を、前提と不確実性を含めて管理するSSOT。

見積もりはまず **Effort Range + Assumptions + Confidence** で示す。単価が与えられている場合のみCostへ変換し、不明な単価を推測しない。

## Estimate Date

2026-10-11

## Confidence

Medium

## Assumptions

- Maintainer 1名を基準とする。
- `init / doctor / check` の初期CLI command implementationは完了済み。
- CLI technologyは TypeScript / Node.js で確定済み。
- Repository rootの `template/` をTemplateのSource of Truthとして維持する。
- v0.1.0までは `bootstrap / status / update` を追加しない。
- `control-plane.yml`、Project Profile、Plugin system、SubagentsはRelease Readinessに含めない。
- npm packageとして配布し、Repository cloneなしでGolden Pathを開始できる状態を目標とする。

## Delivery Effort

### Completed MVP Effort Baseline

初期見積もりは 5.5–12.5 person-days だった。

Product / Architecture、Repository migration、`init / doctor / check`、基本testまでは完了している。ここでは過去実績を再計算せず、残作業だけを再見積もりする。

### Remaining Release Readiness Effort

| Area | Range | Unit | Notes |
|---|---:|---|---|
| Package contract | 0.5–1.0 | person-days | package identity、metadata、Node support、pack contents |
| Template packaging | 0.75–1.5 | person-days | root templateのstaging、installed path解決、Regression test |
| Packed artifact integration | 0.5–1.0 | person-days | npm pack → install → init/doctor/check |
| CLI UX baseline | 0.25–0.75 | person-days | help、version、usage/error整理 |
| Cross-platform CI | 0.5–1.0 | person-days | Windows/Linux、既存checkへ収束 |
| README / dogfood | 0.5–1.0 | person-days | third-party Quick Start、clean environment確認 |
| Release / publish | 0.25–0.75 | person-days | version、release notes、npm/GitHub Release |

### Remaining Total Estimate

- Effort: **3.25–7.0 person-days**
- Initial Cost: Not calculated
- Monthly Cost: 0 external infrastructure expected

## Rate

Not specified

## Running Cost

| Item | Monthly Range | Notes |
|---|---:|---|
| Infrastructure | 0 expected | CLIはHosted infrastructureを必要としない |
| External services | 0 expected | MVPではrequired external APIなし |
| npm registry | 0 expected for public package | Account / scope policyによる |
| Operations | Not calculated | Maintainer effortのみ |

## Main Uncertainty

最大の不確実性は **Template packagingと実際のnpm artifact**。

Source treeでは正常でも、published packageに `template/` が入らない、runtime pathが変わる、Windows/Linuxでprocess/path挙動が異なる可能性がある。そのため最初に `npm pack` したartifactから `init` するVertical Sliceを通す。

## Scenario

- Lean: npm package metadata + Template staging + packed initを最小構成で実装し、CLI frameworkを追加しない。
- Expected: packed Golden Path + help/version + Windows/Linux CI + README dogfoodまで実施する。
- High: npm packaging / Windows behavior / publish設定で追加修正が必要になる。

## Change Log

| Date | Previous | Current | Reason |
|---|---:|---:|---|
| 2026-10-10 | Not estimated | 5.5–12.5 person-days | CLI MVPの初期Scopeを定義 |
| 2026-10-11 | 5.5–12.5 person-days initial total | 3.25–7.0 person-days remaining | `init / doctor / check` 完了後、Release Readiness残作業を再見積もり |
