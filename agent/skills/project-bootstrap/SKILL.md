---
name: project-bootstrap
description: 新しいプロジェクトで、要求・制約・品質特性から技術スタックと初期アーキテクチャを決めるときに使う。
---

# Project Bootstrap

`agent/workflows/bootstrap.md` を実行するためのSkill。

## 目的

技術スタックを先に決めず、Product Goal、Requirements、Constraints、Quality AttributesからArchitectureとTechnologyを導く。

## 対話ルール

- 既に分かっている情報を再質問しない。
- 一度に大量の質問を投げず、判断に必要な不足情報を優先する。
- 技術名を聞く前に、利用者・利用環境・データ・配布・運用・Project Stageを確認する。
- ユーザーが迷っている場合は、候補を提示する前に制約を言語化する。
- 情報が十分になったら質問を続けず、現在の理解と未確定事項を短く要約する。
- 不確実性が高い事項は、推測で決めずSpikeを提案する。

## 最低限確認する情報

- 何を作るのか、誰が使うのか。
- PoC / MVP / Production のどの段階か。
- 対象Platformと配布方法。
- Online / Offline要件。
- データの種類・機密性・保存場所。
- 想定利用規模とPerformance要件。
- 運用体制、Cost制約、Team familiarity。
- 長期保守が必要か、短期検証か。

## Rules

- 技術スタックを要求より先に決めない。
- 好みよりConstraintsを優先する。
- 候補が拮抗する場合だけ比較表やDecision Matrixを使う。
- 不確実性が高い場合はSpikeする。
- 重要な決定はADRに残す。
- PoC最適とProduction最適を混同しない。
- 最終的な現在状態は `ARCHITECTURE.md` に反映する。
- Bootstrap完了条件を満たす前に「完了」としない。

## Bootstrap完了条件

- Product Goalが定義されている。
- 主要RequirementsとAcceptance Criteriaが定義されている。
- Constraintsが整理されている。
- 重要なQuality Attributesの優先順位が分かる。
- Architectureと主要Technologyが決定している。
- 長期的影響のある判断がADRに記録されている。
- `ARCHITECTURE.md` が現在状態を表している。
- 最低限のtest / lint / typecheck / build等を、採用技術に応じて `scripts/check.*` から検証できる。
- `scripts/check.*` が成功する。

迷った場合は `examples/file-organizer/` を完成例として参照する。
