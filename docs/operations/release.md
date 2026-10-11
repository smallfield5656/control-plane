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

`packages/cli/` で公開先accountを `npm whoami` により確認し、`npm publish --access public` を実行する。TokenをRepositoryやTemplateへ保存しない。

npmの公開処理には待ち時間がある。`previously staged version` / E409や直後のE404が出た場合は、同じversionを再送信・変更せず、`npm view <package>@<version> version` で公開状態を確認する。

Release notesは `docs/releases/v<version>.md` に保存し、短い英語の概要、`Highlights:`、必要なら `Migration:` を記載する。

同じcommitへpackage versionに対応する `v<version>` tagを付け、GitHub Releaseを作成する。Release notesには利用者への変更と必要なMigrationを記載する。npm tarballはRepositoryへcommitせず、必要ならRelease assetとして配布する。

## Verify Published Artifact

公開versionを明示してclean Directoryで `--version → init → doctor → next → check` を確認し、生成先の `.gitignore` があることを確認する。

公開済みCLIに `update` はない。既存ProjectのTemplateは自動更新されないため、Migrationが必要ならRelease notesで対象fileと手動更新方法を案内する。

公開成功を確認してから `docs/delivery/milestones.md` の公開状態を更新する。公開準備と公開完了を混同しない。

## v0.2.3 Local Publication

変更を取り込んだRepository rootから実行する。Windows / LinuxとNode.js最低対応版のCIが成功し、working treeがcleanであることを先に確認する。

```bash
git switch main
git pull --ff-only
npm --prefix packages/cli ci
bash scripts/check.sh
cd packages/cli
npm whoami
npm publish --access public
```

`npm whoami` で未ログインなら `npm login` を実行する。公開後は次を繰り返して `0.2.3` の取得が可能になるまで待つ。公開済みversionを再公開しない。

```bash
npm view @smallfield5656/control-plane@0.2.3 version
npm view @smallfield5656/control-plane dist-tags
```

同じターミナルでnpmのgitHeadと現在のcommitの一致を確認してからGitHub Releaseを公開する。`gh auth status` が失敗した場合は `gh auth login --web` で認証する。

```bash
release_commit=$(git rev-parse HEAD)
package_commit=$(npm view @smallfield5656/control-plane@0.2.3 gitHead)
if [ "$package_commit" = "$release_commit" ]; then
  gh release create v0.2.3 \
    --repo smallfield5656/control-plane \
    --target "$release_commit" \
    --title "v0.2.3" \
    --notes-file ../../docs/releases/v0.2.3.md \
    --latest
else
  echo "Stop: npm gitHead differs from the current commit." >&2
fi

gh release view v0.2.3 --repo smallfield5656/control-plane
```

最後に一時Directoryで公開物を確認する。

```bash
verify_dir=$(mktemp -d)
cd "$verify_dir"
npx --yes @smallfield5656/control-plane@0.2.3 --version
npx --yes @smallfield5656/control-plane@0.2.3 init demo
npx --yes @smallfield5656/control-plane@0.2.3 doctor demo
npx --yes @smallfield5656/control-plane@0.2.3 next demo
npx --yes @smallfield5656/control-plane@0.2.3 check demo
```
