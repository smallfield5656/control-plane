# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするためのEngineering Control Planeです。

Repository contractと生成TemplateをDurable Truthとし、CLIはそれらを操作する薄いInterfaceとして実装します。

## Current Phase

Architecture Gateで以下を承認しました。

- 生成先Templateの正本を `template/` に分離する
- 初期CLIを TypeScript / Node.js で実装する

最初のVertical Sliceとして次を実装中です。

```text
control-plane init <directory>
```

`doctor` / `check` / `bootstrap` / `status` / `update` はまだ未実装です。

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

## Initial CLI Contract

### `control-plane init <directory>`

`template/` を新しいDirectoryへ展開します。

- Template本文は `template/` から読む
- 既存Directoryを上書きしない
- partial copyを残しにくいstaging方式を使う
- 生成Projectは自身の `scripts/check.*` を持つ

### Planned

- `control-plane doctor`: Repository状態と次Actionを診断
- `control-plane check`: Projectの既存 `scripts/check.*` を実行

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
