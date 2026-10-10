# CLI MVP Release Readiness Plan

- Status: Completed
- Completed: 2026-10-11
- Release: `v0.1.0`
- npm package: `@smallfield5656/control-plane@0.1.0`
- Release commit: `c46c1c6693f735388a4b30b0033f72aed6a8e8b6`

## Goal

`init / doctor / check` の初期CLI MVPを、第三者がRepositoryをcloneせずに公開npm packageから利用できる状態へ持っていく。

公開Golden Path:

```bash
npx @smallfield5656/control-plane@0.1.0 init my-app
cd my-app
npx @smallfield5656/control-plane@0.1.0 doctor .
npx @smallfield5656/control-plane@0.1.0 check .
```

## Completed Scope

- [x] npm package contractを定義した。
- [x] Node.js support baselineを `>=22` とした。
- [x] root `template/` を唯一のTemplate Source of Truthとして維持した。
- [x] `npm pack` 時だけTemplateをpackage artifactへstagingする方式を実装した。
- [x] packed artifactから `init → doctor → check` を実行するintegration testを追加した。
- [x] `--help` / `--version` を提供した。
- [x] Ubuntu / WindowsのGitHub Actions CIを追加した。
- [x] READMEを第三者向けQuick Start中心へ更新した。
- [x] npm packageを `@smallfield5656/control-plane@0.1.0` としてpublic publishした。
- [x] clean GitHub Actions runnerからpublished packageをdogfoodした。
- [x] `v0.1.0` Git tagを作成した。
- [x] GitHub Release `control-plane v0.1.0` を公開した。

## Release Validation

Release前後に以下を確認した。

```text
source validation
  ↓
npm pack
  ↓
packed artifact install
  ↓
init / doctor / check
  ↓
Ubuntu / Windows CI
  ↓
npm publish
  ↓
clean runnerでpublished package dogfood
  ↓
v0.1.0 tag / GitHub Release
```

公開package dogfoodでは、clean Ubuntu runnerから次を実行して成功した。

```bash
npx --yes @smallfield5656/control-plane@0.1.0 --version
npx --yes @smallfield5656/control-plane@0.1.0 init my-app
npx --yes @smallfield5656/control-plane@0.1.0 doctor my-app
npx --yes @smallfield5656/control-plane@0.1.0 check my-app
```

## Package Naming Decision

当初予定していたunscoped package名 `control-plane` は、npm registryから既存package `controlplane` に近すぎる名前として拒否された。

そのため正式なdistribution identityを次に変更した。

```text
npm package: @smallfield5656/control-plane
CLI bin:     control-plane
```

CLI bin名は変更していない。

## Explicitly Deferred

v0.1.0では以下を追加しなかった。

- `control-plane bootstrap`
- `control-plane status`
- `control-plane update`
- Template provenance / ownership manifest
- `control-plane.yml`
- Project Profile
- Plugin system
- Subagents
- Agent adapters
- Report / Estimate command

これらはv0.1.0以降の実利用から必要性を確認して、新しいProduct / Architecture decisionとして扱う。

## Outcome

CLI MVP Release Readinessは完了した。

control-planeはRepository内だけで動くTemplate/CLIではなく、第三者がnpmから直接開始できる公開CLIになった。
