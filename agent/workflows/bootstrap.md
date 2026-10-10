# Bootstrap Workflow

新しいプロジェクトを始めるときは、技術スタックを先に決めない。

## 1. Product Goal

`docs/product/overview.md` を作成し、Problem / Users / Goals / Non-Goals / Success Criteria を定義する。

## 2. Requirements

`docs/product/requirements.md` に主要 Requirement と Acceptance Criteria を定義する。

## 3. Constraints

`docs/product/constraints.md` に platform、distribution、security、network、data、operations、team、cost、project stage を整理する。

## 4. Quality Attributes

特に重要な品質特性を明確にする。

例:
- Performance
- Reliability
- Security
- Maintainability
- Portability
- Operability
- Testability

## 5. Architecture Candidates

要求と制約から、適切な architecture style を候補化する。

## 6. Technology Candidates

候補技術は次の観点で比較する。

- 要求適合性
- 制約適合性
- 保守性
- 成熟度
- 運用負荷
- ecosystem
- test / lint / type / schema などの自動検証能力
- team familiarity
- lock-in
- cost

必要なら重み付き Decision Matrix を使う。

## 7. Spike

不確実性が高く、議論だけでは判断できない項目は小さな Spike で検証する。

Spike には仮説、成功条件、測定値、結論を残す。

## 8. Decision

長期的な影響がある技術選定は ADR に記録する。

## 9. Current Architecture

採用した現在状態を `ARCHITECTURE.md` に反映する。

## 10. Scaffold

ここまで決まってからプロジェクトを生成する。

最低限、test、lint、typecheck、build 等を `scripts/check.*` から実行可能にする。
