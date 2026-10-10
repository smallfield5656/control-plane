# Architecture

この文書は**現在のアーキテクチャ**の Source of Truth です。

「なぜその判断をしたか」は `docs/architecture/adr/` に記録します。

## Context

`control-plane` は現在、AI-assisted developmentを制御するRepository Templateとして、Product / Delivery / Architecture / Testing / Workflow / ValidationのcontractをMarkdownとScriptで提供している。

CLI追加の準備を進めているが、Repository restructuringとCLI implementation technologyはArchitecture Gate未承認であり、現在Architectureにはまだ含めない。

## Technology Stack

現在のCore contractはTechnology-neutralなMarkdown、Git repository structure、Shell / PowerShell validation scriptで構成する。

CLI implementation technologyは未決定。`docs/architecture/adr/0002-cli-implementation-technology.md` は `Proposed`。

## System Boundaries

### Current

- Product / Delivery / Architecture documentation
- Agent workflows / skills
- GitHub work-intake / PR templates
- Technology-neutral validation entry point (`scripts/check.*`)
- Completed example project

### Proposed, not yet accepted

- Generated project Template assetの `template/` への分離
- `packages/cli/`
- `control-plane init / doctor / check`

## Components

- `README.md`: 人間向け入口
- `AGENTS.md`: AI agent向けrouter
- `docs/product/`: Product Goal / Requirements / Constraints
- `docs/delivery/`: Scope / Estimate / Risks / Milestones
- `docs/architecture/`: Principles / ADR
- `docs/testing/`: Testing Strategy
- `docs/operations/`: Development / Review / Security / CI policy
- `agent/`: Workflows / Skills
- `scripts/check.*`: Control Plane validation entry point
- `examples/`: Completed usage example

## Dependency Direction

Repository上のDurable Truthを中心にし、Agent / future CLIはそれを参照・操作する。

```text
Product / Delivery / Architecture / Workflow / Validation contract
                              ↓
                    Agent / future CLI
```

CLIやVendor-specific設定をSource of Truthにしない。

## Data Flow

現在はRepository filesを人間とAI agentが読み、Workflowに従って変更し、`scripts/check.*` で検証する。

CLI導入後も、CLIが独自のWorkflow truthを持たず、Repository assetとValidation Entry Pointを利用する方針を提案している。

## External Dependencies

Current core contractは特定のHosted serviceやAI vendorを必須としない。

GitHub Issue / Pull RequestはWork Intake / Proposed Changeとして利用できるが、Repository上のDurable Truthとは分離する。

## Constraints

`docs/product/constraints.md` を参照してください。

## Pending Architecture Decisions

- ADR-0001: `docs/architecture/adr/0001-separate-template-assets.md`
- ADR-0002: `docs/architecture/adr/0002-cli-implementation-technology.md`

いずれも `Proposed` であり、Architecture Gate承認前にRepository移動やCLI scaffoldを開始しない。
