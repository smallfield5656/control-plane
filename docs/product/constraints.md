# Constraints

このファイルは、技術選定や設計が満たすべき制約の Source of Truth です。

## Platform

- 初期対象は Windows と Linux。
- macOS対応を妨げるPlatform依存設計を避ける。
- CLI technologyは未決定。特定言語・runtimeをConstraintとして先に固定しない。

## Distribution

- 初期CLIは第三者が導入しやすい配布形態を優先する。
- Single binary、package manager、runtime依存方式をTechnology Decisionで比較する。
- CLIとTemplateは当面同一Repositoryで管理する。

## Security / Privacy

- 初期MVPはCredentialやSecretを必須としない。
- `init / doctor / check` は原則local filesystem上で完結する。
- 既存Projectを破壊的に変更しない。

## Network

- 初期CLIの通常操作はInternet接続を必須としない。
- Remote API integrationは初期MVPのOut of Scope。

## Data

- 主な入力はRepository structure、Markdown、ADR、Script等のlocal files。
- 初期CLIで独自databaseを導入しない。
- Machine-readable configは必要性が実証されるまで必須化しない。

## Operations

- LocalとCIの最終Validation Entry Pointは既存の `scripts/check.*` とする。
- CLIへValidation logicを複製しない。
- Repository再編後もTemplate assetの完全性を自動検証できること。

## Team / Skills

- 小規模Maintainerを前提とし、保守負荷を低く保つ。
- AI coding agentが理解・変更・検証しやすい構造を重視する。
- Technology選定ではecosystem familiarityだけでなくdistribution / cross-platform / testabilityを比較する。

## Cost

- 金額Budgetは未指定。
- 初期MVPは有料Infrastructureや常時稼働Serviceを要求しない。

## Project Stage

- 現在は **MVP preparation / Architecture Gate pending**。
- CLI implementation technologyとRepository restructuringは未承認。
