# Release

## Release Contract

package versionの正本は `packages/cli/package.json`。lockfileは同じversionを保持し、Git tag / GitHub Release / npm versionを対応させる。

公開済みversion・tagを上書きしない。配布物の修正は新しいpatch versionとして公開する。Repositoryだけの整理ではnpm更新は不要だが、CLI、生成Template、packagingが変わる場合は更新する。

## Prepare and Verify

1. `main` の承認済み変更を取り込み、versionを確認する。未追跡Template assetはReviewして `git add` する。
2. `npm --prefix packages/cli ci` と `scripts/check.*` を実行し、Windows / Linux CIの成功を確認する。
3. versionが未更新なら `packages/cli/` で `npm version patch --no-git-tag-version` を実行し、package.jsonとlockfileをcommitする。
4. version更新後の検証結果を確認する。packed artifact integration testが正本の `.gitignore`、CLI version、Golden Pathを確認する。
5. `npm pack --dry-run --json` で配布file一覧をReviewする。CLIのbuild出力とgenerated Template、package metadata、READMEだけを配布する。

## Publish

公開はnpmのStaged Packagesを使い、uploadと人間による公開承認を分離する。`npm stage` にはNode.js 22.14.0以上、npm CLI 11.15.0以上が必要。

`packages/cli/` で公開先accountを `npm whoami` により確認し、cleanなrelease commitから次を実行する。TokenをRepositoryやTemplateへ保存しない。

```bash
npm stage publish --access public
```

表示されたstage IDに対して `npm stage view <stage-id>` と `npm stage download <stage-id>` を実行し、package name、version、tag、access、収録file、shasumをReviewする。承認者はnpmjs.comのStaged Packagesで同じstageを確認し、2FAを使ってApproveする。OTPはIssue、Repository、Agentの会話へ記録しない。

npmの検証・公開処理には待ち時間がある。stageが一覧から消えた場合や、`previously staged version` / E409、公開直後のE404が出た場合は、同じversionを再送信・変更せず、`npm view <package>@<version> version dist.shasum dist.integrity` と `npm view <package> dist-tags` で公開状態を確認する。公開後の `dist.shasum` はReviewしたstageのshasumと一致しなければならない。

Release notesは `docs/releases/v<version>.md` に保存し、短い英語の概要、`Highlights:`、必要なら `Migration:` を記載する。

同じcommitへpackage versionに対応する `v<version>` tagを付け、GitHub Releaseを作成する。Release notesには利用者への変更と必要なMigrationを記載する。npm tarballはRepositoryへcommitせず、必要ならRelease assetとして配布する。

通常のnpm publishでmetadataに `gitHead` がある場合はtag対象commitとの一致を確認する。Staged Packages経由では `gitHead` が付かないことがあるため、その場合は次の連鎖をRelease Gateの証跡とする。

1. working treeがcleanなrelease commitからstageしたこと
2. downloadしたstageのshasumが `npm stage view` のshasumと一致すること
3. 公開後の `dist.shasum` がstageのshasumと一致すること
4. Git tagとGitHub Releaseが同じrelease commitを指すこと

## Verify Published Artifact

公開versionを明示してclean Directoryで `--version → init → doctor → next → check` を確認し、生成先の `.gitignore` があることを確認する。

公開済みCLIに `update` はない。既存ProjectのTemplateは自動更新されないため、Migrationが必要ならRelease notesで対象fileと手動更新方法を案内する。

公開成功を確認してから `docs/delivery/milestones.md` の公開状態を更新する。公開準備と公開完了を混同しない。

## Staged Publication Commands

変更を取り込んだRepository rootから実行する。Windows / LinuxとNode.js最低対応版のCIが成功し、working treeがcleanであることを先に確認する。環境のnpmが11.15.0未満なら、system npmを置換せず `npx --yes npm@<supported-version> stage ...` で対応版を一時実行できる。

```bash
git switch main
git pull --ff-only
npm --prefix packages/cli ci
bash scripts/check.sh
cd packages/cli
npm whoami
npm stage publish --access public
npm stage list @smallfield5656/control-plane
stage_id="replace-with-stage-id"
npm stage view "$stage_id"
npm stage download "$stage_id"
```

承認者がnpmjs.comのStaged PackagesでApproveした後、対象versionの取得が可能になるまで次を確認する。公開済みversionを再公開しない。

```bash
release_version="0.3.0"
npm view "@smallfield5656/control-plane@$release_version" version dist.shasum dist.integrity
npm view @smallfield5656/control-plane dist-tags
```

stageと公開物のshasumが一致することを確認してからGitHub Releaseを公開する。`gh auth status` が失敗した場合は `gh auth login --web` で認証する。

```bash
release_version="0.3.0"
release_commit=$(git rev-parse HEAD)
gh release create "v$release_version" \
  --repo smallfield5656/control-plane \
  --target "$release_commit" \
  --title "v$release_version" \
  --notes-file "../../docs/releases/v$release_version.md" \
  --latest
gh release view "v$release_version" --repo smallfield5656/control-plane
```

最後に一時Directoryで公開物を確認する。

```bash
release_version="0.3.0"
verify_dir=$(mktemp -d)
cd "$verify_dir"
npx --yes "@smallfield5656/control-plane@$release_version" --version
npx --yes "@smallfield5656/control-plane@$release_version" init demo
npx --yes "@smallfield5656/control-plane@$release_version" doctor demo
npx --yes "@smallfield5656/control-plane@$release_version" next demo
npx --yes "@smallfield5656/control-plane@$release_version" check demo
```
