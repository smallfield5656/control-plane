# @smallfield5656/control-plane

AI-assisted software projects向けのEngineering Control Plane CLIです。

## Quick Start

```bash
npx @smallfield5656/control-plane init my-app
cd my-app
npx @smallfield5656/control-plane doctor .
npx @smallfield5656/control-plane bootstrap .
npx @smallfield5656/control-plane check .
```

npm package名は `@smallfield5656/control-plane`、実行されるCLI bin名は `control-plane` です。

`init` はControl Plane Templateを新規Directoryへ展開します。既存Directoryは上書きしません。

`bootstrap` はRepositoryを変更せず、Bootstrapの現在地を固定ルールで判定します。Bootstrap中は `Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、次に触る具体的なRepository pathとAI Agentへコピーできる短いInstructionを案内します。Architecture Gateでは `Review Inputs` / `Human Gate` / `Decision` を表示し、人間の判断を優先します。

CLIはAI APIを利用せず、ADRの承認・却下やRepository更新も行いません。詳細なWorkflowはRepository上の `AGENTS.md` と関連WorkflowがSource of Truthであり、Suggested Instructionはそれらへの入口だけを示します。

## Commands

```text
control-plane init <directory>
control-plane doctor [directory]
control-plane bootstrap [directory]
control-plane check [directory]
control-plane --help
control-plane --version
```

Template / Workflow / Validation contractがDurable Truthであり、CLIはそれらを操作する薄いInterfaceです。
