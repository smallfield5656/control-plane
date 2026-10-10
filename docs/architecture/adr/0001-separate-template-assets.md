# ADR-0001: Separate generated project template assets from the control-plane product repository

- Status: Proposed
- Date: 2026-10-10
- Supersedes: —

## Context

現在のRepository rootには、生成先Projectで使う `AGENTS.md`、`ARCHITECTURE.md`、`docs/`、`agent/`、`scripts/`、`.github/` と、control-plane自身のProduct repositoryとして今後必要になるCLIやProduct documentationが同居している。

CLIが `init` でTemplateを展開するには、生成対象assetとcontrol-plane自身のassetの境界が明確である必要がある。

## Decision

生成先Project用assetを `template/` 配下へ分離し、Repository rootをcontrol-plane自身のProduct repositoryとして扱う案を採用候補とする。

想定構成:

```text
control-plane/
├── README.md
├── AGENTS.md
├── packages/
│   └── cli/
├── template/
│   ├── AGENTS.md
│   ├── ARCHITECTURE.md
│   ├── docs/
│   ├── agent/
│   ├── scripts/
│   └── .github/
├── docs/
└── ...
```

Architecture Gate承認前には移動を行わない。

## Consequences

### Positive

- CLIの生成対象が明確になる。
- control-plane自身のProduct docsと生成先ProjectのTemplate docsを分離できる。
- CLIとTemplateを同一Repositoryで同期して変更できる。
- 将来の `control-plane update` やTemplate versioningの基盤にできる。

### Negative / Trade-offs

- 既存README、scripts/check.*、Example、Workflowのpath参照を移行する必要がある。
- 現在の「cloneしてそのままProject化する」利用方法にmigrationが必要になる。
- Migration時にTemplate assetの欠落・参照切れRiskがある。

## Alternatives Considered

### RootをTemplateのまま維持しCLIだけ追加

- 利点: Migrationが小さい。
- 欠点: Product repositoryと生成Templateの責務が曖昧なまま残る。

### CLIを別Repositoryへ分離

- 利点: Release cycleを分離しやすい。
- 欠点: 現段階ではTemplate / Workflow / CLIの仕様同期コストとversion driftが大きい。

## Validation

承認後のMigrationでは、移動前後のTemplate inventoryを比較し、生成したfixture projectに対してControl Plane validationが成功することを確認する。
