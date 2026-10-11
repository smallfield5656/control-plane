# Architecture

この文書は**現在のアーキテクチャ**の Source of Truth です。

「なぜその判断をしたか」は `docs/architecture/adr/` に記録します。

## Context

`control-plane` は、AI-assisted developmentを制御するRepository contractと、その導入・診断・次Action案内・検証実行を支援するCLIから構成する。

ADR-0001からADR-0005までのArchitecture Gateを通過し、生成先Templateの正本を `template/` に分離し、CLIをTypeScript / Node.jsで実装し、標準Agent SkillsとControl Plane固有Workflowを別pathで管理する構成を採用した。

## Technology Stack

- Durable contract: Markdown / Git repository structure
- Validation: Shell / PowerShell
- CLI: TypeScript / Node.js
- CLI build: TypeScript compiler
- CLI tests: Node.js built-in test runner

## System Boundaries

### control-plane product repository

- Product / Delivery / Architecture documentation
- Standard Agent Skills in `.agents/skills/`
- Control Plane-specific workflows in `agent/workflows/`
- `packages/cli/`
- Product-level validation entry point (`scripts/check.*`)

### Generated project template

`template/` が `control-plane init` の唯一の生成Source。

- `AGENTS.md`
- `ARCHITECTURE.md`
- `.agents/skills/`
- `agent/workflows/`
- `docs/`
- `scripts/`
- `.github/`
- placeholder source directories

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
- `.agents/skills/`: 標準Agent Skills。WorkflowやDurable Truthを実行するAdapter
- `agent/workflows/`: Control Plane固有のProject Workflow
- `docs/`: control-plane自身のDurable Truth
- `template/`: 生成先Project assetの正本
- `packages/cli/src/init.ts`: Template展開
- `packages/cli/scripts/stage-template.mjs`: Git管理対象から配布用Templateを生成
- `packages/cli/src/doctor.ts`: Repository診断
- `packages/cli/src/bootstrap.ts`: Repository状態からNext Step / Human Gate / Suggested Instructionを導出
- `packages/cli/src/check.ts`: 既存Validation Entry Pointの選択と実行
- `packages/cli/src/index.ts`: CLI command routing
- `packages/cli/src/output.ts`: 共通の色・TTY / environment判定。Node.js標準APIだけを使い、診断・Workflow logicから分離する。
- `scripts/check.*`: control-plane productのValidation Entry Point
- `scripts/check-project.*`: CLI + Template固有Validation
- `examples/`: Control Plane製品の完成例。生成先Projectには配布しない

## Dependency Direction

```text
Product / Architecture / Workflow / Validation contract
                         ↓
             Agent Skills as adapters
                         ↓
                     template/
                         ↓
          CLI init / doctor / next / check
                         ↓
                  Generated Project
```

CLIへTemplate本文、Workflow truth、Validation logicを重複してhard-codeしない。

標準Agent Skillは `.agents/skills/` に置き、Control Plane固有Workflowは `agent/workflows/` に置く。SkillはWorkflowやDurable Truthを複製せず、それらを実行するAdapterとして扱う。

`doctor` は既存Repository contractを読む診断Interfaceであり、Bootstrap WorkflowそのものをCLIへ複製しない。

`next` はRepositoryのCurrent TruthとWorkflow状態を読み、次に参照すべきcontextとActionを案内する。詳細WorkflowをCLIへ複製せず、Bootstrap中は `agent/workflows/bootstrap.md`、通常開発では `agent/workflows/issue.md` を参照させる。

`bootstrap` は互換Aliasとして `next` と同じ結果を返す。

`check` はProjectの `scripts/check.*` を選択・実行するだけで、Validation rule自体は保持しない。

## Data Flow

### init

`build` はroot `template/` のGit管理対象を、working treeの内容で `packages/cli/template/` へstagingする。GitはMaintainerのbuildに必要であり、配布済みCLIの実行には要求しない。未追跡・ignored fileを含めず、Credentialに相当するpathとSymbolic linkを拒否する。

開発時と配布時の `control-plane init <directory>` は同じstaging済みTemplateを読み、既存targetを上書きせず新しいDirectoryへ展開する。root source directoryへのfallbackは持たない。

npmで除外されるroot `.gitignore` はartifact内だけ `gitignore.template` として運び、`init` が `.gitignore` へ復元する。本文の正本は引き続きroot `template/.gitignore` であり、CLIへ埋め込まない。

Control Plane製品固有の完成例はroot `examples/` に保持し、staging対象の `template/` から分離する。

staging copy、build出力、npm tarballは生成物でありGitへ追跡しない。設計理由はADR-0004を参照する。

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
- ADR-0003: `docs/architecture/adr/0003-standard-agent-skills-path.md`
- ADR-0004: `docs/architecture/adr/0004-tracked-template-distribution.md`
