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
- Scaffold時は `docs/testing/strategy.md` に従い、採用Technologyの慣習と合わせてTest placementを決める。
- Bootstrap後はルートREADMEをそのProject固有の入口へ置き換える。
- Architecture Gate待ちをBootstrap完了と呼ばない。
- Bootstrap完了条件を満たす前に「完了」としない。
- 文書が埋まっていることと人間が承認したことを区別する。人間の明示的な承認発言がない限り承認を記録しない。

## 明示的な承認の記録

Bootstrapの項目、input、dependency、現在の承認は `.control-plane/bootstrap-state.json` を正本とする。

人間が対象項目を明示的に承認した場合だけ、Repository rootから次を実行する。

```bash
control-plane approve <item-id>
```

item IDと対象はProjectのstateと `control-plane next` の案内に従う。既存ProjectのIDを推測で変更しない。ADRの承認・却下・置き換えは `docs/architecture/adr/README.md` を参照する。

- 無言、会話終了、修正がなくなったこと、Agent自身の品質判断を承認と解釈しない。
- 実行前に承認対象と現在のinputを人間へ明示する。
- 共通CLIは対象と上流dependencyのrevisionを記録する。承認後に内容が変わると `control-plane next` は `Needs Review` を返す。旧record-approval adapterは同じCLIへ委譲する。
- 承認JSONやADRの採用Statusを直接編集してGuardを迂回しない。人間が直接CLIを使う場合と同じ検証・排他・復旧処理を通す。
- `TODO` placeholderが残る場合は承認を記録しない。
- 差し戻し時は必要なSSOTを更新し、Approval historyや議事録をstate fileへ追加しない。

## Bootstrap Preparation Complete

人間承認が必要なArchitecture decisionがある場合、次を満たした時点で実装を止めてArchitecture Gateを待つ。

- Product Goal、主要Requirements、Acceptance Criteria、Constraintsが整理されている。
- Scope / Effort Estimate / Risks / Milestonesが必要な粒度で整理されている。
- Architecture / Technology候補と推奨理由を説明できる。
- 人間が判断すべき事項が明確になっている。
- 長期的影響のある提案がADR `Proposed` として記録されている。

この状態はBootstrap完了ではない。承認前にScaffoldや実装へ進まない。

## Bootstrap完了条件

- Product Goalが定義されている。
- 主要RequirementsとAcceptance Criteriaが定義されている。
- ConstraintsがTechnology Decisionと分離されている。
- 重要なQuality Attributesの優先順位が分かる。
- Scope / Effort Estimate / Risks / Milestonesが必要な粒度で整理されている。
- Architectureと主要Technologyが決定している。
- 長期的影響のある判断がADRに記録され、必要な承認状態が反映されている。
- `.control-plane/bootstrap-state.json` の全項目が現在revisionに対して明示的に承認されている。
- `ARCHITECTURE.md` が現在状態を表している。
- ルートREADMEがProject固有の入口になっている。
- 採用技術固有の検証が必要なら `scripts/check-project.sh` または `scripts/check-project.ps1` から検証できる。
- Bootstrap文書に必須の `TODO:` が残っていない。
- `scripts/check.*` が成功する。

迷った場合は `examples/file-organizer/` を完成例として参照する。
