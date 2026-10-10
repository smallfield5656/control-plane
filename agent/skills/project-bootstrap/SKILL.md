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
- ConstraintとTechnology Decisionを分離する。技術比較の結果をConstraintとして先回りして固定しない。
- 好みよりConstraintsを優先する。
- 候補が拮抗する場合だけ比較表やDecision Matrixを使う。
- 不確実性が高い場合はSpikeする。
- 重要な決定はADRに残す。
- 人間承認が必要なADRは承認前を `Proposed`、承認後を `Accepted` とする。
- PoC最適とProduction最適を混同しない。
- 見積もりはEffort range + Confidenceを先に示し、単価不明なら金額を推測しない。
- 最終的な現在状態は `ARCHITECTURE.md` に反映する。
- Bootstrap後はルートREADMEをそのProject固有の入口へ置き換える。
- Bootstrap完了条件を満たす前に「完了」としない。

## Bootstrap完了条件

- Product Goalが定義されている。
- 主要RequirementsとAcceptance Criteriaが定義されている。
- ConstraintsがTechnology Decisionと分離されている。
- 重要なQuality Attributesの優先順位が分かる。
- Scope / Effort Estimate / Risks / Milestonesが必要な粒度で整理されている。
- Architectureと主要Technologyが決定している。
- 長期的影響のある判断がADRに記録され、必要な承認状態が反映されている。
- `ARCHITECTURE.md` が現在状態を表している。
- ルートREADMEがProject固有の入口になっている。
- 採用技術固有の検証が必要なら `scripts/check-project.sh` または `scripts/check-project.ps1` から検証できる。
- Bootstrap文書に必須の `TODO:` が残っていない。
- `scripts/check.*` が成功する。

迷った場合は `examples/file-organizer/` を完成例として参照する。
