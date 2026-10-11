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

`next` はRepositoryを変更せず、現在状態から次にやるべきことを固定ルールで案内する主コマンドです。Bootstrap中は `Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、Architecture Gateでは `Review Inputs` / `Human Gate` / `Decision` を表示して人間の判断を優先します。

Bootstrap完了後は `Next Step: Ongoing Development` と `Change Intake: GitHub Issue` を表示し、`AGENTS.md` と `agent/workflows/issue.md` を入口にした変更要求用の `Suggested Instruction` を案内します。CLI自身はIssueを作成せず、変更内容やIssue番号を推測しません。

`bootstrap` は `next` の後方互換Aliasです。

CLIはAI APIを利用せず、ADRの承認・却下やRepository更新も行いません。詳細なWorkflowはRepository上の `AGENTS.md` と関連WorkflowがSource of Truthであり、Suggested Instructionはそれらへの入口だけを示します。

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
