# @smallfield5656/control-plane

AI-assisted software projects向けのEngineering Control Plane CLIです。

## Quick Start

```bash
npx @smallfield5656/control-plane init my-app
cd my-app
npx @smallfield5656/control-plane next .
npx @smallfield5656/control-plane check .
```

npm package名は `@smallfield5656/control-plane`、実行されるCLI bin名は `control-plane` です。

`init` はControl Plane Templateを新規Directoryへ展開します。既存Directoryは上書きしません。

`next` はRepositoryを変更せず、`.control-plane/bootstrap-state.json` の明示的人間承認と現在revisionから次にやるべきことを決定論的に案内する主コマンドです。Bootstrap中は `Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、Architecture Gateでは `Review Inputs` / `Human Gate` / `Decision` を表示して人間の判断を優先します。

Bootstrap完了後は `Next Step: Ongoing Development` と `Change Intake: GitHub Issue` を表示し、`AGENTS.md` と `agent/workflows/issue.md` を入口にした変更要求用の `Suggested Instruction` を案内します。CLI自身はIssueを作成せず、変更内容やIssue番号を推測しません。

`bootstrap` は `next` の後方互換Aliasです。

CLIはAI APIを利用せず、ADRの承認・却下やRepository更新も行いません。人間から明示的な承認を受けたAI AgentがProject Bootstrap SkillのadapterでCurrent Stateを更新し、CLIはread-onlyで検証します。詳細なWorkflowはRepository上の `AGENTS.md` と関連WorkflowがSource of Truthであり、Suggested Instructionはそれらへの入口だけを示します。

## Commands

```text
control-plane init <directory>
control-plane doctor [directory]
control-plane next [directory]
control-plane bootstrap [directory]  alias for next
control-plane check [directory]
control-plane --help
control-plane --version
```

Template / Workflow / Validation contractがDurable Truthであり、CLIはそれらを操作する薄いInterfaceです。

## Terminal Output

成功は緑、未完了・承認待ちは黄、エラーは赤、見出しと次の作業はシアンで表示します。文字と記号でも状態を識別できます。

TTYを自動判定し、パイプ・ファイル保存・CIでは既定で色を付けません。`NO_COLOR=1` または `--no-color` で無効化できます。

```bash
control-plane next --no-color
control-plane --no-color doctor
control-plane check --no-color
```

`--no-color` は検証の子プロセスにも伝わります。`FORCE_COLOR=1` は明示的な着色に使えますが、無効化指定を優先します。`--version` とコピー用の依頼文は常に装飾しません。

独立した `TODO` / `TODO:` が文書に残っている項目は承認準備未完了として扱います。Placeholderがなくなっただけでは `Complete` になりません。制約がない場合は `なし` と理由を記載してください。

v0.3以降は `.control-plane/bootstrap-state.json` と `.agents/skills/project-bootstrap/scripts/record-approval.mjs` が必要です。既存ProjectのTemplate assetはCLI更新では自動更新されないため、Release notesのMigrationに従って追加してください。
