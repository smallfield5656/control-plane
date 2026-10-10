# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするための開発テンプレートです。

## Quick Start

新しいプロジェクトでは、最初に技術スタックを決めません。まず AI agent に次のように依頼してください。

```text
このリポジトリの AGENTS.md と agent/workflows/bootstrap.md に従って、
このプロジェクトの Bootstrap を開始してください。

作りたいもの:
<ここに概要を書く>

まだ技術スタックは決めていません。
不足している情報だけを質問し、Requirements / Constraints / Architecture / ADR を整理した後で Scaffold してください。
```

Golden Path は次の通りです。

```text
Product idea
  ↓
Bootstrap discovery
  ↓
Requirements / Constraints
  ↓
Architecture / Technology decision
  ↓
Spike（不確実性が高い場合のみ）
  ↓
ADR
  ↓
Scaffold
  ↓
TDD / Implementation
  ↓
scripts/check.*
```

Bootstrap 完了後は、振る舞いの変更を `RED → GREEN → REFACTOR` で進め、作業完了前に `scripts/check.sh` または `scripts/check.ps1` を実行します。

## まず見る場所

人間向けの入口はこの `README.md`、AI agent向けの入口は `AGENTS.md` です。

- 現在のアーキテクチャ: `ARCHITECTURE.md`
- Product Goal / Requirements / Constraints: `docs/product/`
- Architecture decisions: `docs/architecture/adr/`
- Testing policy: `docs/testing/strategy.md`
- Bootstrap workflow: `agent/workflows/bootstrap.md`
- Bootstrap Skill: `agent/skills/project-bootstrap/SKILL.md`
- 完成例: `examples/file-organizer/`
- 統一検証コマンド: `scripts/check.*`

## 基本思想

- **SSOT**: 同じ事実を複数箇所に重複させない。
- **Bootstrap first**: 技術ありきではなく、要求・制約・品質特性から技術を選ぶ。
- **TDD**: 振る舞いの変更では `RED → GREEN → REFACTOR` を基本とする。
- **Executable rules**: 守るべきルールは、可能な限り test / lint / CI / script にする。
- **Small instructions**: `AGENTS.md` や Skill は巨大化させず、必要な情報へのルーターとして使う。
- **Vendor neutral**: 特定のAIツール固有設定をSSOTにしない。
- **Complexity must be earned**: 複雑さは、必要性が実証されてから導入する。

## Required / Recommended / Optional

### Required

- Product Goal、Requirements、Constraintsを明文化する。
- 長期的影響のあるArchitecture decisionはADRに残す。
- 現在状態を `ARCHITECTURE.md` に反映する。
- 作業完了前に `scripts/check.*` を通す。

### Recommended

- 振る舞いの変更はTDDで進める。
- 不確実性が高い技術判断は小さなSpikeで検証する。
- Bug fixではRegression testを先に追加する。

### Optional

- 候補が拮抗するときのDecision Matrix。
- Subagent、追加Skill、Harness固有機能。
- プロジェクト規模に対して過剰なプロセスは導入しない。

## Example

`examples/file-organizer/` には、単純なWindows向けファイル整理ツールを題材に、Product GoalからRequirement、Constraint、ADR、Architectureまでがどうつながるかを示しています。

テンプレートの各ファイルに何を書けばよいか迷った場合は、まずこのExampleを参照してください。
