# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするためのEngineering Control Planeです。

Repository contractと生成TemplateをDurable Truthとし、CLIはそれらを操作する薄いInterfaceとして実装します。

## Public Quick Start

```bash
npx @smallfield5656/control-plane init my-app
cd my-app
npx @smallfield5656/control-plane next .
npx @smallfield5656/control-plane check .
```

npm packageは `@smallfield5656/control-plane`、CLI bin名は `control-plane` です。

`next` はRepositoryを変更せず、現在状態から次にやるべきことを案内する主コマンドです。Bootstrap中は Product Definition / Delivery Framing / Architecture Preparation / Human Gate / Finalization を案内し、Bootstrap完了後はIssue-drivenなOngoing Developmentへ橋渡しします。

`bootstrap` は `next` の後方互換Aliasとして残しています。

## Commands

```text
control-plane init <directory>
control-plane doctor [directory]
control-plane next [directory]
control-plane bootstrap [directory]  # alias for next
control-plane check [directory]
control-plane --help
control-plane --version
```

役割は次のように分かれます。

```text
init    = Projectを開始する
doctor  = Repositoryの状態や不足を診断する
next    = 次に何をすべきか案内する
check   = Project全体をValidationする
```

## Guidance Flow

Fresh Templateでは `next` がBootstrapの現在地を判定します。

```text
Product Definition
→ Delivery Framing
→ Architecture Preparation
→ Architecture Gate
→ Bootstrap Finalization
→ Ongoing Development
```

Architecture Gateが必要な場合は、Proposed ADRをHuman Gateとして提示し、承認前に実装へ進みません。

Bootstrap完了後は、変更要求をGitHub Issueとして受け付けるための `Suggested Instruction` を表示します。詳細な通常開発フローは生成Projectの `agent/workflows/issue.md` がSource of Truthです。

## Agent Assets

標準的なAgent Skillsは `.agents/skills/` に配置します。Control Plane固有のProject Workflowは `agent/workflows/` に分離します。

```text
.agents/skills/       = reusable Agent Skills
agent/workflows/      = Control Plane-specific workflows
```

SkillはWorkflowやDurable Truthを複製せず、それらを実行するためのAdapterとして扱います。

## Durable Truth

Generated Projectでは次の境界を維持します。

```text
requirements.md / constraints.md / delivery docs / ARCHITECTURE.md
    = Current Truth

ADR
    = Decision History

Issue / Pull Request / Git
    = Change History
```

Current state documents are updated. Decision records are superseded. Git preserves history.

## Development Quick Start

control-plane自身を開発する場合:

```bash
git clone https://github.com/smallfield5656/control-plane.git
cd control-plane
npm --prefix packages/cli ci
bash scripts/check.sh
```

CLIをsource treeから実行する場合:

```bash
npm --prefix packages/cli run build
node packages/cli/dist/index.js init ../my-app
node packages/cli/dist/index.js next ../my-app
node packages/cli/dist/index.js check ../my-app
```

### Packed artifactを確認する

```bash
cd packages/cli
npm pack
```

`build` 時にroot `template/` のGit管理対象だけをpackage artifactへstagingします。新しいTemplate assetは `git add template/<path>` してからbuildしてください。既存assetはworking treeの変更内容を使います。

開発時と配布時のCLIは同じstaging済みTemplateを読みます。`postpack` はstaging copyを削除するため、pack後にsource treeから `init` する場合は再buildしてください。root `template/` だけがSource of Truthです。

公開・version・GitHub Releaseの手順は [Release](docs/operations/release.md) を参照してください。

## Repository Structure

```text
control-plane/
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── .agents/
│   └── skills/           # standard Agent Skills
├── agent/
│   └── workflows/        # Control Plane-specific workflows
├── docs/                 # control-plane自身のSSOT
├── scripts/              # product validation
├── packages/
│   └── cli/              # npm package / TypeScript CLI
├── template/             # 生成先Project assetの唯一の正本
└── examples/             # template/examples/ への入口
```

## Sources of Truth

- Product: `docs/product/`
- Delivery: `docs/delivery/`
- Current Architecture: `ARCHITECTURE.md`
- ADR: `docs/architecture/adr/`
- Testing: `docs/testing/strategy.md`
- Development / Review / Security / CI: `docs/operations/development.md`
- Agent Skills: `.agents/skills/`
- Bootstrap workflow: `agent/workflows/bootstrap.md`
- Generated project template: `template/`

## Principles

- **SSOT**: One fact, one authoritative location.
- **Repository = Durable Truth**: Issueや会話を永続仕様にしない。
- **CLI should point to context, not duplicate context.**
- **Executable rules**: 重要なRuleは可能な限りtest / lint / scriptで検証する。
- **Vendor neutral**: 特定AI vendorの設定をSSOTにしない。
- **Complexity must be earned**: 必要性が実証されてから抽象化や仕組みを追加する。
