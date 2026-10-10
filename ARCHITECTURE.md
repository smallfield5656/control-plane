# Architecture

この文書は**現在のアーキテクチャ**の Source of Truth です。

「なぜその判断をしたか」は `docs/architecture/adr/` に記録します。

## Context

`control-plane` は、AI-assisted developmentを制御するRepository contractと、その導入・診断を支援するCLIから構成する。

ADR-0001 / ADR-0002のArchitecture Gateを通過し、生成先Templateの正本を `template/` に分離し、初期CLIをTypeScript / Node.jsで実装する構成を採用した。

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

まだ未実装:

- `check`
- `bootstrap`
- `status`
- `update`

## Components

- `README.md`: 人間向け入口とCLI Quick Start
- `AGENTS.md`: control-plane自身のAI agent router
- `docs/`: control-plane自身のDurable Truth
- `template/`: 生成先Project assetの正本
- `packages/cli/src/init.ts`: Template展開
- `packages/cli/src/doctor.ts`: Repository診断
- `packages/cli/src/index.ts`: CLI command routing
- `scripts/check.*`: control-plane productのValidation Entry Point
- `scripts/check-project.*`: CLI + Template固有Validation
- `examples/`: control-plane自身の完成例

## Dependency Direction

```text
Product / Architecture / Workflow contract
                 ↓
             template/
                 ↓
        CLI init / doctor
                 ↓
        Generated Project
```

CLIへTemplate本文やWorkflow truthを重複してhard-codeしない。

`doctor` は既存Repository contractを読む診断Interfaceであり、Bootstrap WorkflowそのものをCLIへ複製しない。

## Data Flow

### init

`control-plane init <directory>` は `template/` を読み、既存targetを上書きせず新しいDirectoryへ展開する。

### doctor

`control-plane doctor [directory]` は対象Repositoryをread-onlyで確認する。

診断対象は以下に限定する。

- 必須Control Plane assetの存在
- Product / Delivery文書の未完了placeholder
- Proposed ADRの存在
- Current Architectureの未確定状態
- Project READMEがTemplateのまま残っていないか

`doctor` はValidationを実行せず、Validation成功やBootstrap Completeを推測しない。文書上の準備が整った場合は `Ready for Validation` とし、次Actionとして `scripts/check.*` を案内する。

生成後のProjectは自身の `scripts/check.*` をValidation Entry Pointとして持つ。

## External Dependencies

CLI development/buildにはNode.jsとnpmを利用する。

Core Template contractは特定のHosted serviceやAI vendorを必須としない。

## Constraints

`docs/product/constraints.md` を参照してください。

## Accepted Architecture Decisions

- ADR-0001: `docs/architecture/adr/0001-separate-template-assets.md`
- ADR-0002: `docs/architecture/adr/0002-cli-implementation-technology.md`
