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

同じcommitへpackage versionに対応する `v<version>` tagを付け、GitHub Releaseを作成する。Release notesには利用者への変更と必要なMigrationを記載する。npm tarballはRepositoryへcommitせず、必要ならRelease assetとして配布する。

## Verify Published Artifact

公開versionを明示してclean Directoryで `--version → init → doctor → next → check` を確認し、生成先の `.gitignore` があることを確認する。

公開済みCLIに `update` はない。既存ProjectのTemplateは自動更新されないため、Migrationが必要ならRelease notesで対象fileと手動更新方法を案内する。

公開成功を確認してから `docs/delivery/milestones.md` の公開状態を更新する。公開準備と公開完了を混同しない。
