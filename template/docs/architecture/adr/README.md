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

## Decision Operations

Project rootで対象文書と `control-plane next` のReview Inputsを確認し、次を実行する。対象番号は4桁とし、0000や番号重複は操作できない。

```bash
control-plane approve adr 0001
control-plane reject adr 0001 --reason "別案を検討するため"
```

approveは指定ProposedのStatusと採用内容の照合記録を更新する。上流の宣言と現在記録は `.control-plane/bootstrap-state.json` を正本とする。rejectは上流承認が無効でも使え、理由を対象の `## Rejection Reason` 欄へ保存する。変更済みの却下内容や異なる理由は再実行で上書きしない。

採用後にAIがCurrent Architectureへ判断を反映し、人間が `control-plane approve <Architecture item ID>` で全体を確認する。ADRの採用だけではArchitecture項目を承認しない。

Accepted ADRが変更されず上流だけが変更された場合、人間が上流をdependency順に再承認し、新しい前提でも判断が成立することを確認して同じapprove adrを実行する。Accepted本文の変更は再承認できない。

## Replacement Metadata

metadataは文書先頭に1回ずつ記載する。Statusの値は上記の4種類、Supersedesは `—` または `ADR-0001, ADR-0002` の番号参照、Superseded Byは `—` または単一の `ADR-0003` とする。本文へ紛らわしいStatus行を追加しない。

判断の置き換えは、新ADRをProposedで作り、Supersedesで旧ADRを指定する。人間の新ADR承認後、AIが旧ADRの `- Status: Superseded` と `- Superseded By: ADR-NNNN` だけを更新する。旧ADRの本文・過去の理由・採用記録は変更しない。新旧参照が未完成・循環・曖昧な場合や本文が変わった場合はArchitecture承認を拒否する。

既存の個別記録のないAccepted / Supersededは、現在内容と上流を人間が確認して `control-plane migrate adr NNNN` で明示移行する。過去の承認を復元したと扱わない。
