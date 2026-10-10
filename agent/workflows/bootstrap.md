# Bootstrap Workflow

新しいプロジェクトを始めるときは、技術スタックを先に決めない。Bootstrapは、要件を埋める作業ではなく、判断に必要な情報を集め、未確定事項を減らし、実装可能な初期状態まで持っていくためのWorkflowである。

## 0. Discovery

最初に、作りたいものを短く把握する。不足情報だけを対話で補う。

最低限確認する項目:

- 何を作るか、誰が使うか。
- Project Stage: PoC / MVP / Production。
- 対象Platformと配布方法。
- Online / Offline要件。
- データの種類、機密性、保存場所。
- 想定利用規模と主要Performance要件。
- 運用体制、Cost制約、Team familiarity。
- 長期保守か短期検証か。

質問は一度に大量に投げず、意思決定に必要な不足情報を優先する。

## 1. Product Goal

`docs/product/overview.md` を作成し、Problem / Users / Goals / Non-Goals / Success Criteria を定義する。

## 2. Requirements

`docs/product/requirements.md` に主要RequirementとAcceptance Criteriaを定義する。

Implementation detailやTechnology choiceをRequirementに混ぜない。

## 3. Constraints

`docs/product/constraints.md` にplatform、distribution、security、network、data、operations、team、cost、project stageを整理する。

## 4. Quality Attributes

特に重要なQuality Attributesと、その優先順位を明確にする。

例:
- Performance
- Reliability
- Security
- Maintainability
- Portability
- Operability
- Testability

すべてを最高優先にしない。Trade-offが必要な場合は明示する。

## 5. Architecture Candidates

要求と制約から、適切なarchitecture styleを候補化する。

候補を増やしすぎず、Hard Constraintに反する候補は早めに除外する。

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

候補が明確に優劣のつく場合は、無理に数値化しない。候補が拮抗する場合だけDecision Matrixを使う。

## 7. Spike

不確実性が高く、議論だけでは判断できない項目は小さなSpikeで検証する。

Spikeには以下を残す。

- 仮説
- 成功条件
- 測定方法
- 結果
- 結論

Spike用コードをProduction codeとしてそのまま採用しない。

## 8. Decision

長期的な影響がある技術選定はADRに記録する。

ADRには、少なくともContext / Decision / Consequencesを記載する。

## 9. Current Architecture

採用した現在状態を `ARCHITECTURE.md` に反映する。

ADRは「なぜ」、`ARCHITECTURE.md` は「現在どうなっているか」を表す。

## 10. Scaffold

ここまで決まってからプロジェクトを生成する。

最低限、採用技術に応じたtest、lint、typecheck、build等を `scripts/check.*` から実行可能にする。

## Bootstrap Completion Gate

次を満たすまでBootstrap完了としない。

- Product Goalが定義されている。
- 主要RequirementsとAcceptance Criteriaが定義されている。
- Constraintsが整理されている。
- 重要なQuality Attributesの優先順位が分かる。
- Architectureと主要Technologyが決定している。
- 必要なADRが作成されている。
- `ARCHITECTURE.md` が現在状態を表している。
- `scripts/check.*` が成功する。

書き方に迷った場合は `examples/file-organizer/` を参照する。
