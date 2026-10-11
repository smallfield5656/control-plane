# Architecture

この文書は**現在のアーキテクチャ**の Source of Truth です。

「なぜその判断をしたか」は `docs/architecture/adr/` に記録します。

## Context

`control-plane` は、AI-assisted developmentを制御するRepository contractと、その導入・診断・次Action案内・検証実行を支援するCLIから構成する。

ADR-0001 / ADR-0002のArchitecture Gateを通過し、生成先Templateの正本を `template/` に分離し、CLIをTypeScript / Node.jsで実装する構成を採用した。

## Technology Stack

- Durable contract: Markdown / Git repository structure
- Validation: Shell / PowerShell
- CLI: TypeScript / Node.js
- CLI build: TypeScript compiler
- CLI tests: Node.js built-in test runner

## System Boundaries

### control-plane product repository

- Product / Delivery / Architecture documentation
- Agent workflows / skills used to develop control-plane itself
- `packages/cli/`
- Product-level validation entry point (`scripts/check.*`)

### Generated project template

`template/` が `control-plane init` の唯一の生成Source。

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/`
- `agent/`
- `scripts/`
- `.github/`
- examples / placeholder source directories

### CLI

現在実装済み:

- `control-plane init <directory>`
- `control-plane doctor [directory]`
- `control-plane next [directory]`
- `control-plane bootstrap [directory]` — `next` の後方互換Alias
- `control-plane check [directory]`

`next` はRepository状態から次のActionを決定論的に案内する主コマンドであり、Bootstrap中だけでなくBootstrap Complete後のOngoing Developmentへの導線も持つ。

未導入:

- `status`
- `update`

## Components

- `README.md`: 人間向け入口とCLI Quick Start
- `AGENTS.md`: control-plane自身のAI agent router
- `docs/`: control-plane自身のDurable Truth
- `template/`: 生成先Project assetの正本
- `packages/cli/src/init.ts`: Template展開
- `packages/cli/src/doctor.ts`: Repository診断
- `packages/cli/src/bootstrap.ts`: Repository状態からNext Step / Human Gate / Suggested Instructionを導出
- `packages/cli/src/check.ts`: 既存Validation Entry Pointの選択と実行
- `packages/cli/src/index.ts`: CLI command routing
- `scripts/check.*`: control-plane productのValidation Entry Point
- `scripts/check-project.*`: CLI + Template固有Validation
- `examples/`: control-plane自身の完成例

## Dependency Direction

```text
Product / Architecture / Workflow / Validation contract
                         ↓
                     template/
                         ↓
          CLI init / doctor / next / check
                         ↓
                  Generated Project
```

CLIへTemplate本文、Workflow truth、Validation logicを重複してhard-codeしない。

`doctor` は既存Repository contractを読む診断Interfaceであり、Bootstrap WorkflowそのものをCLIへ複製しない。

`next` はRepositoryのCurrent TruthとWorkflow状態を読み、次に参照すべきcontextとActionを案内する。詳細WorkflowをCLIへ複製せず、Bootstrap中は `agent/workflows/bootstrap.md`、通常開発では `agent/workflows/issue.md` を参照させる。

`bootstrap` は互換Aliasとして `next` と同じ結果を返す。

`check` はProjectの `scripts/check.*` を選択・実行するだけで、Validation rule自体は保持しない。

## Data Flow

### init

`control-plane init <directory>` は `template/` を読み、既存targetを上書きせず新しいDirectoryへ展開する。

### doctor

`control-plane doctor [directory]` は対象Repositoryをread-onlyで確認し、必須asset、Bootstrap placeholder、Proposed ADR、Current Architecture、Project READMEから保守的に状態と次Actionを提示する。

Validationは実行せず、成功を推測しない。

### next

`control-plane next [directory]` は対象Repositoryをread-onlyで確認し、状態に応じて `Next Step` / `Work On` / `Goal` / `Suggested Instruction` / `Human Gate` を提示する。

Bootstrap Complete後は `Ongoing Development` を案内し、GitHub IssueをChange Intakeとして `agent/workflows/issue.md` へ橋渡しする。

CLI自身はIssueを作成せず、Issue番号や変更内容を推測しない。

### check

`control-plane check [directory]` は対象Platformで利用可能な既存Validation Entry Pointを起動する。

- Windows: `scripts/check.ps1` を優先
- その他: `scripts/check.sh` を優先
- preferred scriptがない場合、利用可能なもう一方へfallback
- child processのstdout / stderrを継承
- exit codeを呼び出し元へ伝播

生成ProjectのValidation contractは引き続き `scripts/check.*` がSource of Truth。

## External Dependencies

CLI development/buildにはNode.jsとnpmを利用する。

Shell validationには実行Platform上の `bash`、PowerShell validationには `powershell.exe` または `pwsh` が必要になる。

Core Template contractは特定のHosted serviceやAI vendorを必須としない。

## Constraints

`docs/product/constraints.md` を参照してください。

## Accepted Architecture Decisions

- ADR-0001: `docs/architecture/adr/0001-separate-template-assets.md`
- ADR-0002: `docs/architecture/adr/0002-cli-implementation-technology.md`
