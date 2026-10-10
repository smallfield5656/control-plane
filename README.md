# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするためのEngineering Control Planeです。

Repository contractと生成TemplateをDurable Truthとし、CLIはそれらを操作する薄いInterfaceとして実装します。

## Public Quick Start

npm公開後のGolden Pathはこれだけです。

```bash
npx control-plane init my-app
cd my-app
npx control-plane doctor .
npx control-plane check .
```

Fresh Templateでは `doctor` は通常 `Bootstrap In Progress` を返します。`AGENTS.md` をAI agentの入口として、`agent/workflows/bootstrap.md` に従ってProduct Goal / Requirements / Constraints / Delivery / Architectureを整理してください。

`init` は既存Directoryを上書きしません。`doctor` はread-only診断、`check` はProject自身の `scripts/check.*` を実行するValidation Interfaceです。

## Current Phase

初期CLI MVPは実装済みです。

- `control-plane init <directory>`
- `control-plane doctor [directory]`
- `control-plane check [directory]`
- `control-plane --help`
- `control-plane --version`

現在はv0.1.0のnpm Release Readinessを進めています。Repository cloneなしの `npx control-plane init my-app` を公開Golden Pathとします。

`bootstrap` / `status` / `update` はv0.1.0のOut of Scopeです。

## Development Quick Start

npm公開前、またはcontrol-plane自身を開発する場合:

```bash
git clone https://github.com/smallfield5656/control-plane.git
cd control-plane
npm --prefix packages/cli install
bash scripts/check.sh
```

CLIをsource treeから実行する場合:

```bash
npm --prefix packages/cli run build
node packages/cli/dist/index.js init ../my-app
node packages/cli/dist/index.js doctor ../my-app
node packages/cli/dist/index.js check ../my-app
```

### Packed artifactを確認する

```bash
cd packages/cli
npm pack
```

`prepack` 時にroot `template/` をpackage artifactへstagingし、`postpack` でstaging copyを削除します。root `template/` だけがSource of Truthです。

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
│   └── cli/              # npm package / TypeScript CLI
├── template/             # 生成先Project assetの唯一の正本
└── examples/
```

重要な境界:

```text
root template/
    = Source of Truth

npm package/template/
    = pack時だけ作るdistribution artifact

CLI
    = 操作Interface
```

CLIへTemplate本文やWorkflow logicを重複してhard-codeしません。

## CLI Contract

### `control-plane init <directory>`

`template/` を新しいDirectoryへ展開します。

- published packageではpackage同梱Templateを利用する
- source treeではroot `template/` を利用する
- 既存Directoryを上書きしない
- partial copyを残しにくいstaging方式を使う
- 生成Projectは自身の `scripts/check.*` を持つ

### `control-plane doctor [directory]`

Repositoryを読み、人間向けに状態と次Actionを診断します。

主な状態:

- `Setup Incomplete`
- `Bootstrap In Progress`
- `Architecture Gate Pending`
- `Needs Review`
- `Ready for Validation`

### `control-plane check [directory]`

対象Projectの既存Validation Entry Pointを実行します。

- Windowsでは `scripts/check.ps1` を優先
- その他のPlatformでは `scripts/check.sh` を優先
- preferred scriptがない場合は利用可能なもう一方へfallback
- Validation scriptのexit codeを伝播
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

- `control-plane.yml`
- Project Profile
- Plugin system
- Subagents
- Agent adapters
- 独自Harness runtime

必要性が実案件で繰り返し確認されてから追加します。
