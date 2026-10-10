# Architecture Decision Records

ADR は、長期的な影響がある設計判断について「なぜそう決めたか」を残すために使います。

`ARCHITECTURE.md` は現在の状態、ADR は判断の履歴です。

## Naming

`NNNN-short-title.md`

例: `0001-use-sqlite.md`

## Status

- `Proposed`: 判断案。人間のArchitecture Gateや必要な検証が未完了。
- `Accepted`: 必要なレビュー・Decision Gateを通過し、採用された判断。
- `Rejected`: 検討したが採用しなかった判断。
- `Superseded`: 後続ADRによって置き換えられた判断。

人間承認が必要な判断を、承認前に `Accepted` にしない。

Accepted な ADR の過去の判断理由を書き換えない。方針を変更する場合は新しい ADR を作り、旧 ADR を Superseded にする。
