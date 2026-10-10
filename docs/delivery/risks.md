# Risks

プロジェクトの主要Riskと対応方針を管理するSSOT。

## Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner | Trigger / Signal | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Repository再編で既存Template assetが欠落・参照切れする | Medium | High | Migration前後のinventoryとgolden-path validationを用意する | Maintainer | check失敗、README/Workflow参照切れ | Mitigated |
| R-002 | CLIにWorkflow/Validation logicが重複しSSOTが分裂する | Medium | High | CLIはTemplate/Workflow/scriptsを呼ぶ薄いInterfaceに限定する | Maintainer | 同じRuleがCLI codeとdocs/scriptsの両方に現れる | Open |
| R-003 | CLI technologyを早期固定しdistribution/保守で不利になる | Low | Medium | TypeScript / Node.js採用後もruntime dependencyとpackagingをartifact testで検証する | Maintainer | distributionで追加runtime問題が発生 | Mitigated |
| R-004 | `control-plane.yml` やProfileを先行導入し不要なschemaを固定する | Medium | Medium | v0.1.0までは導入しない | Maintainer | Release Readinessと無関係な設定項目が増える | Open |
| R-005 | Cross-platform behaviorの差でcheck実行やpath処理が壊れる | Medium | High | Windows/Linux CIとpacked artifact validationを実施する | Maintainer | Platform固有test失敗 | Open |
| R-006 | doctorがRepository状態を過度に推測し誤診する | Medium | Medium | 判定根拠を限定し、不明状態はNeeds Reviewとして扱う | Maintainer | 実状態とdoctor表示が不一致 | Mitigated |
| R-007 | CLI scopeがAgent runtime/Plugin/Harnessへ拡大しMVPが肥大化する | Medium | Medium | v0.1.0まではinit/doctor/checkと配布基盤だけに限定する | Maintainer | bootstrap/status/update等の実装開始 | Open |
| R-008 | npm packageに `template/` が含まれず、published CLIの `init` が失敗する | Medium | High | root `template/` をSSOTにし、pack時にartifactへstagingしてpacked CLIからintegration testする | Maintainer | source treeでは成功するがpacked initが失敗 | Open |
| R-009 | package用Template copyが第二のSSOTになりroot `template/` とdriftする | Medium | High | package内Templateはgenerated artifactとして扱い、手編集禁止。pack/test時にrootから生成する | Maintainer | package側Templateだけに差分が入る | Open |
| R-010 | npm package名やNode support rangeを公開後に変更しづらくなる | Medium | Medium | RR-1でpackage identity / enginesをDecision Gateとして確認してからpublishする | Maintainer / Approver | package名衝突、unsupported Node報告 | Open |
| R-011 | CIへbuild/test knowledgeを重複させLocal validationとdriftする | Medium | Medium | GitHub Actionsはruntime/dependency setup後に `scripts/check.*` を実行する | Maintainer | CIだけ成功/失敗するRule差異 | Open |
| R-012 | READMEがRepository maintainer視点に寄り、第三者が最初の操作を完了できない | Medium | Medium | npm/npx Quick Startを先頭に置き、clean environment dogfoodをRelease Gateに含める | Maintainer / Tester | README利用者がclone/build手順を必要とする | Open |
| R-013 | npm publish / GitHub Release / package versionが不一致になる | Low-Medium | Medium | v0.1.0 Release checklistでversion/tag/release/packageを照合する | Maintainer | registryとGit tagでversion差異 | Open |

## Current Focus

Release Readiness中の最優先Riskは R-008 / R-009。

つまり「Source treeでは動くが、実際に配布されたnpm packageからは動かない」状態を最初に潰す。

そのため最初のVertical Sliceを次に限定する。

```text
root template (SSOT)
      ↓
npm pack artifact
      ↓
installed CLI
      ↓
control-plane init
```

このflowが通るまで、CIや追加commandへScopeを広げない。

## Rules

- Probability / Impact は簡潔な尺度でよい。数値化が目的ではない。
- Ownerを明示し、誰も持たないRiskを作らない。
- 実装やIssueから重大Riskが見つかった場合はここへ昇格する。
- 解消済みRiskは削除せずStatusを更新する。
