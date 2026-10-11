# ADR-0004: Git管理対象から配布用Templateを生成する

- Status: Accepted
- Date: 2026-10-11
- Supersedes: —

## Context

root `template/` が生成assetの正本である一方、Directory丸ごとのcopyではMaintainerの未追跡ファイルがnpm artifactへ混入する。npmは `.gitignore` 自体を除外するため、配布済みCLIからの `init` でProjectの除外設定が欠落していた。

source treeのCLIだけroot Templateへfallbackすると、配布前後でasset inventoryとPrivacyの条件が変わる。別manifestや独自設定schemaを追加せず、既存のGit管理とartifact integration testを活用する。

## Decision

- root `template/` を引き続き唯一の正本とする。
- build時にGit indexからTemplateのasset inventoryを取得し、working treeの内容をstagingする。
- 未追跡・ignored fileは配布対象へ含めない。Credentialに相当するpathとSymbolic linkはbuildを失敗させる。
- source treeとnpm artifactのCLIは同じstaging済みTemplateを使う。
- root `.gitignore` はartifact内だけ `gitignore.template` に変換し、`init` で復元する。
- staging copy、build出力、npm tarballはGitへ追跡しない。
- 完成例の本文は `template/examples/` に集約し、rootの完成例は正本への入口だけを残す。

ADR-0001のProduct / Template境界とADR-0003のSkill / Workflow境界は維持する。

## Consequences

### Positive

- 開発時と配布時のasset inventoryを一致させられる。
- ローカルファイルの誤配布と `.gitignore` の欠落をRegression testで検出できる。
- 独自manifest、runtime dependency、Plugin systemを増やさない。
- 完成例と生成物に第二の正本を持たない。

### Trade-offs

- MaintainerのbuildにはGit checkoutが必要。新しいassetは `git add` が必要になる。
- pack後はstaging copyが消えるため、source treeでの `init` には再buildが必要。
- path guardは任意のMarkdown等に埋め込まれたSecretを検出する仕組みではない。公開前の内容ReviewとSecret scanningは引き続き必要。

## Validation

- packed artifactから生成した `.gitignore` が正本と一致する。
- ignored / untracked fileがstagingされず、source treeの `init` にも混入しない。
- 強制追跡したCredential pathとSymbolic linkをstaging時に拒否する。
- LocalとWindows / Linux CIで `scripts/check.*` を実行する。
