# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするためのEngineering Control Planeです。

Repository contractと生成TemplateをDurable Truthとし、CLIはそれらを操作する薄いInterfaceとして実装します。

## Current Phase

Architecture Gateで以下を承認済みです。

- 生成先Templateの正本を `template/` に分離する
- 初期CLIを TypeScript / Node.js で実装する

初期CLI MVPとして次を実装済みです。

- `control-plane init <directory>`
- `control-plane doctor [directory]`
- `control-plane check [directory]`

`bootstrap` / `status` / `update` は初期CLI MVPのOut of Scopeです。

## Quick Start

### 1. Repositoryを取得

```bash
git clone <control-plane repository URL>
cd control-plane
```

### 2. CLI dependencyをinstallしてbuild

```bash
npm --prefix packages/cli install
npm --prefix packages/cli run build
```

### 3. 新しいProjectを生成

Repositoryの1つ上に `my-project` を作る例:

```bash
node packages/cli/dist/index.js init ../my-project
```

既存Directoryは上書きしません。

### 4. 生成Projectを診断

```bash
node packages/cli/dist/index.js doctor ../my-project
```

Fresh Templateでは通常、次の状態になります。

```text
Status: Bootstrap In Progress
```

`doctor` はRepositoryを変更せず、主要asset、Bootstrap placeholder、Proposed ADR、Current Architecture、Project READMEを読み、次Actionを提示します。

### 5. 生成ProjectをValidation

CLIから実行する場合:

```bash
node packages/cli/dist/index.js check ../my-project
```

CLIはValidation logicを持たず、対象Projectの既存 `scripts/check.*` を実行します。

直接実行しても同じcontractです。

Linux / macOS / WSL:

```bash
cd ../my-project
bash scripts/check.sh
```

Windows PowerShell:

```powershell
cd ..\my-project
.\scripts\check.ps1
```

`doctor` は診断、`check` / `scripts/check.*` はValidationです。

## Repository Structure

```text
control-plane/
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── docs/                 # control-plane自身のSSOT
├── agent/                # control-plane自身のWorkflow / Skill
├── scripts/              # product validation
├── packages/
│   └── cli/              # TypeScript / Node.js CLI
├── template/             # 生成先Project assetの正本
└── examples/
```

重要な境界:

```text
Template / Workflow / Validation contract
                = Durable Truth

CLI             = 操作Interface
```

CLIへTemplate本文やWorkflow logicを重複してhard-codeしません。

## CLI Contract

### `control-plane init <directory>`

`template/` を新しいDirectoryへ展開します。

- Template本文は `template/` から読む
- 既存Directoryを上書きしない
- partial copyを残しにくいstaging方式を使う
- 生成Projectは自身の `scripts/check.*` を持つ

### `control-plane doctor [directory]`

Repositoryを読み、人間向けに状態と次Actionを診断します。

主な状態:

- `Setup Incomplete`: 必須assetが欠けている
- `Bootstrap In Progress`: Product / Delivery等のplaceholderが残っている
- `Architecture Gate Pending`: Bootstrap文書が整い、Proposed ADRと未確定Architectureがある
- `Needs Review`: ADR / Architectureの状態が機械的に安全に確定できない
- `Ready for Validation`: 文書上のBootstrap準備は整っており、Validationが次Action

`doctor` はWorkflowやRequirementsの新しいSource of Truthではありません。

### `control-plane check [directory]`

対象Projectの既存Validation Entry Pointを実行します。

- Windowsでは `scripts/check.ps1` を優先
- その他のPlatformでは `scripts/check.sh` を優先
- preferred scriptがない場合、利用可能なもう一方へfallback
- stdout / stderrをそのまま表示
- Validation scriptのexit codeをCLIへ伝播
- Validation logicそのものはCLIへ複製しない

## Development

control-plane自身の開発でもControl Plane Workflowをdogfoodします。

1. `docs/product/` でGoal / Requirements / Constraintsを確認
2. `docs/delivery/` でScope / Estimate / Risks / Milestonesを確認
3. 長期的Decisionは `docs/architecture/adr/` へ記録
4. Behavior changeはTDDを基本とする
5. `scripts/check.*` を共通Validation Entry Pointとして使う
6. Review / CIでも同じValidation contractを利用する

## Sources of Truth

- Product: `docs/product/`
- Delivery: `docs/delivery/`
- Current Architecture: `ARCHITECTURE.md`
- ADR: `docs/architecture/adr/`
- Testing: `docs/testing/strategy.md`
- Development / Review / Security / CI: `docs/operations/development.md`
- Bootstrap workflow: `agent/workflows/bootstrap.md`
- Generated project template: `template/`

## Principles

- **SSOT**: One fact, one authoritative location.
- **Bootstrap first**: Requirements / Constraints before Technology.
- **Repository = Durable Truth**: Issueや会話を永続仕様にしない。
- **Executable rules**: 重要なRuleは可能な限りtest / lint / scriptで検証する。
- **Vendor neutral**: 特定AI vendorの設定をSSOTにしない。
- **Complexity must be earned**: 必要性が実証されてから抽象化や仕組みを追加する。

## Not Yet Added

初期CLI MVPでは以下を前提にしません。

- `control-plane.yml`
- Project Profile
- Plugin system
- Subagents
- Agent adapters
- 独自Harness runtime

必要性が実案件で繰り返し確認されてから追加します。
