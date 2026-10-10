# CLI MVP Release Readiness Plan

`init / doctor / check` の初期CLI MVPを、第三者がRepositoryをcloneせずに試せる配布可能な状態へ持っていくための実行計画。

このPlanは作業順序とAcceptance CriteriaのSSOTとする。GitHub Issueを使う場合も、永続的な計画変更はこの文書へ反映する。

## Goal

第三者が公開されたnpm packageから、少なくとも次の流れを実行できる状態にする。

```text
npx <package-name> init my-project
        ↓
cd my-project
        ↓
AI agentでBootstrap
        ↓
npx <package-name> doctor .
        ↓
npx <package-name> check .
```

Release Readiness完了時点では `bootstrap / status / update` は実装しない。

## Delivery Strategy

一度にRelease基盤を作り切らず、以下のVertical Sliceを順番に完了させる。

各Sliceは原則として次を満たしてから次へ進む。

- Behavior changeは必要なtestを先に追加する。
- `scripts/check.*` が成功する。
- README / ARCHITECTURE / Delivery SSOTに現在状態を反映する。
- Scope外の仕組みを先回りして追加しない。

---

## RR-1: Package Contract

### Purpose

CLIを「Repository内で動くcode」から「npm packageとして成立するproduct」へ変える。

### Tasks

- [ ] npm上のpackage identityを決める。
- [ ] `packages/cli/package.json` を公開可能なmetadataへ整理する。
- [ ] `private: true` の扱いを見直す。
- [ ] Node.js support policyを決め、`engines` に反映する。
- [ ] `files` / package contentsを明示し、不要なsourceやtestを配布しない。
- [ ] license / repository / description等、第三者利用に必要なmetadataを揃える。

### Acceptance Criteria

- [ ] `npm pack --dry-run` で意図した配布内容を説明できる。
- [ ] package metadataがREADME / Repository structureと矛盾しない。
- [ ] package identityとNode support rangeが明示されている。

### Decision Gate

Package名とNode support rangeは、公開後の互換性に影響するため実装前にMaintainerが確認する。

---

## RR-2: Template Packaging

### Purpose

Repository rootの `template/` をSource of Truthのまま維持しつつ、npm packageから `init` できるようにする。

### Tasks

- [ ] `template/` をpackage artifactへ含めるbuild/pack方式を実装する。
- [ ] CLI source内へTemplate本文をコピーしない。
- [ ] package artifact内のTemplate pathをCLIが解決できるようにする。
- [ ] development checkoutとinstalled packageの両方でTemplate解決を検証する。
- [ ] staleなpackaging copyがSSOT化しないよう生成物として扱う。

### Acceptance Criteria

- [ ] root `template/` が唯一のTemplate sourceである。
- [ ] packed packageだけを使って `init` が成功する。
- [ ] 生成Projectの主要assetが欠落しない。
- [ ] 生成Projectの `scripts/check.*` が成功する。

### Main Risk

Packageには `packages/cli/` 外のfileをそのまま含めにくいため、pack時のasset stagingがReleaseで最も壊れやすい境界になる。

---

## RR-3: Packed Artifact Integration Test

### Purpose

Source treeではなく、実際に配布されるtarballをGolden Pathで検証する。

### Tasks

- [ ] `npm pack` でtarballを生成するtest flowを作る。
- [ ] 一時Directoryへpacked CLIをinstallする。
- [ ] packed CLIから `init` を実行する。
- [ ] 生成Projectで `doctor` を実行する。
- [ ] 生成Projectで `check` を実行する。
- [ ] package内にTemplate assetが含まれないRegressionを検出する。

### Acceptance Criteria

次のflowが自動化されて成功する。

```text
source
  ↓
npm pack
  ↓
install packed artifact
  ↓
init
  ↓
doctor
  ↓
check
```

---

## RR-4: CLI UX Baseline

### Purpose

第三者がCLI commandを知らなくても自力で利用方法を確認できるようにする。

### Tasks

- [ ] `control-plane --help` を提供する。
- [ ] `control-plane --version` を提供する。
- [ ] `init / doctor / check` のusage/error表示を整理する。
- [ ] 不正argumentのexit codeを統一する。
- [ ] CLI framework dependencyが本当に必要か評価する。

### Acceptance Criteria

- [ ] helpだけで3commandと主要argumentが分かる。
- [ ] versionがpackage versionと一致する。
- [ ] user error / validation failure / internal failureの区別が過度な複雑さなしに説明できる。

### Complexity Rule

Commander等のCLI frameworkは、自前routingが明確に保守困難になった場合のみ導入する。

---

## RR-5: Cross-platform CI

### Purpose

Windows / Linuxを主要対象とするCLI contractを継続的に検証する。

### Tasks

- [ ] control-plane product用GitHub Actions workflowを追加する。
- [ ] Linux jobで `scripts/check.sh` を実行する。
- [ ] Windows jobで `scripts/check.ps1` を実行する。
- [ ] Node / dependency setup後は、既存 `scripts/check.*` へ収束させる。
- [ ] CI YAMLへtest / build ruleを重複記述しない。
- [ ] packed artifact integration testを適切なjobで実行する。

### Acceptance Criteria

- [ ] Linuxで全validation成功。
- [ ] Windowsで全validation成功。
- [ ] CIとLocalで最終Validation Entry Pointが同じ。

---

## RR-6: Third-party Quick Start / Dogfooding

### Purpose

Repositoryの内部構造を知らない利用者がREADMEだけで最初のProjectを作れる状態にする。

### Tasks

- [ ] README先頭を利用者向けQuick Start中心にする。
- [ ] npm / npx経由の実行例へ切り替える。
- [ ] `init → Bootstrap → doctor → check` の役割を短く説明する。
- [ ] Maintainer向けbuild手順は利用者向け手順と分離する。
- [ ] clean environmentでREADMEの手順だけを使うdogfoodを行う。
- [ ] 少なくとも1つの新規Projectをpacked/published CLIから生成する。

### Acceptance Criteria

- [ ] Repository cloneなしでGolden Pathを開始できる。
- [ ] READMEだけで最初の5〜10分の操作が分かる。
- [ ] dogfoodで見つかった摩擦がIssueまたはSSOTへ反映される。

---

## RR-7: v0.1.0 Release Gate

### Purpose

`init / doctor / check` を最初の公開MVPとして区切る。

### Tasks

- [ ] Release checklistを確認する。
- [ ] package versionを確定する。
- [ ] changelog/release notesを用意する。
- [ ] npm publish方法と権限を確認する。
- [ ] Git tag / GitHub Releaseとnpm versionを一致させる。
- [ ] 公開後に`npx` Golden Pathを再確認する。

### Release Gate

以下を満たしたときのみv0.1.0 release readyとする。

- [ ] `init / doctor / check` がmainに存在する。
- [ ] packed artifact integration test成功。
- [ ] Windows / Linux CI成功。
- [ ] README Quick Start成功。
- [ ] npm packageからTemplate assetを含めて `init` できる。
- [ ] published packageから `doctor / check` が実行できる。
- [ ] Critical / Highの未対応Release blockerがない。

---

## Explicitly Deferred Until After v0.1.0

以下はRelease Readiness中には実装しない。

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

Release後の実利用で必要性を確認してから次のArchitecture / Product decisionとして扱う。

## Suggested Execution Order

```text
RR-1 Package Contract
        ↓
RR-2 Template Packaging
        ↓
RR-3 Packed Artifact Test
        ↓
RR-4 CLI UX
        ↓
RR-5 Windows/Linux CI
        ↓
RR-6 Third-party Dogfood
        ↓
RR-7 v0.1.0 Release Gate
```

最初の実装Sliceは **RR-1 + RR-2の最小部分** とする。

「npm packしたartifactから `init` が成功する」ところまでを1PRで通し、その後にpacked Golden Path全体へ広げる。
