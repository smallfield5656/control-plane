# Risks

プロジェクトの主要Riskと対応方針を管理するSSOT。

## Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner | Trigger / Signal | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Repository再編で既存Template assetが欠落・参照切れする | Medium | High | Migration前後のinventoryとgolden-path validationを用意する | Maintainer | check失敗、README/Workflow参照切れ | Mitigated |
| R-002 | CLIにWorkflow/Validation logicが重複しSSOTが分裂する | Medium | High | CLIはTemplate/Workflow/scriptsを呼ぶ薄いInterfaceに限定する | Maintainer | 同じRuleがCLI codeとdocs/scriptsの両方に現れる | Open |
| R-003 | CLI technologyを早期固定しdistribution/保守で不利になる | Low | Medium | TypeScript / Node.js採用後もruntime dependencyとpackagingをartifact testで検証する | Maintainer | distributionで追加runtime問題が発生 | Mitigated |
| R-004 | `control-plane.yml` やProfileを先行導入し不要なschemaを固定する | Medium | Medium | 必要性が実証されるまで必須化しない | Maintainer | Release Readinessと無関係な設定項目が増える | Open |
| R-005 | Cross-platform behaviorの差でcheck実行やpath処理が壊れる | Medium | High | Windows/Linux CIとpacked artifact validationを実施する | Maintainer | Platform固有test失敗 | Open |
| R-006 | doctorがRepository状態を過度に推測し誤診する | Medium | Medium | 判定根拠を限定し、不明状態はNeeds Reviewとして扱う | Maintainer | 実状態とdoctor表示が不一致 | Mitigated |
| R-007 | CLI scopeがAgent runtime/Plugin/Harnessへ拡大しMVPが肥大化する | Medium | Medium | 現在のcommand Scopeと配布完全性の修正に限定する | Maintainer | 未承認の追加command / runtimeの導入 | Open |
| R-008 | npm packageに `template/` が含まれず、published CLIの `init` が失敗する | Medium | High | root `template/` をSSOTにし、pack時にartifactへstagingしてpacked CLIからintegration testする | Maintainer | source treeでは成功するがpacked initが失敗 | Mitigated |
| R-009 | package用Template copyが第二のSSOTになりroot `template/` とdriftする | Medium | High | package内Templateはgenerated artifactとして扱い、手編集禁止。pack/test時にrootから生成する | Maintainer | package側Templateだけに差分が入る | Mitigated |
| R-010 | npm package名やNode support rangeを公開後に変更しづらくなる | Medium | Medium | RR-1でpackage identity / enginesをDecision Gateとして確認してからpublishする | Maintainer / Approver | package名衝突、unsupported Node報告 | Open |
| R-011 | CIへbuild/test knowledgeを重複させLocal validationとdriftする | Medium | Medium | GitHub Actionsはruntime/dependency setup後に `scripts/check.*` を実行する | Maintainer | CIだけ成功/失敗するRule差異 | Open |
| R-012 | READMEがRepository maintainer視点に寄り、第三者が最初の操作を完了できない | Medium | Medium | npm/npx Quick Startを先頭に置き、clean environment dogfoodをRelease Gateに含める | Maintainer / Tester | README利用者がclone/build手順を必要とする | Open |
| R-013 | npm publish / GitHub Release / package versionが不一致になる | Low-Medium | Medium | Release contractでversion/tag/release/packageを照合する | Maintainer | registryとGit tagでversion差異 | Open |
| R-014 | Templateの未追跡・ignored fileがartifactへ混入する | Medium | High | Git管理対象だけをstagingし、path guardとRegression testで確認する | Maintainer | stagingへのローカルfile混入 | Mitigated |
| R-015 | npm artifactで `.gitignore` が欠落し生成ProjectがSecret等を誤追跡する | Medium | High | transport nameから復元しpacked integration testで正本との一致を確認する | Maintainer | 生成Projectに `.gitignore` がない | Mitigated |
| R-016 | tracked Markdown等の本文にSecret / PIIが混入する | Medium | High | 内容ReviewとGitHub Secret scanning / Push protectionの設定確認 | Maintainer | 内容ReviewやSecret検出の警告 | Open |
| R-017 | 承認後の変更や上流変更に古い承認が残り、Bootstrapが誤って先へ進む | Medium | High | transitive input revisionをCurrent Stateへ記録し、不一致をNeeds Reviewにする | Maintainer | 承認後の編集でCompleteが維持される | Mitigated |
| R-018 | AI Agentが明示的人間承認なしにapproval stateを更新する | Medium | High | Workflow / Skillで明示発言だけを根拠とし、adapter実行をGit履歴でReviewする | Maintainer / Approver | 会話終了やAgent判断だけでapprovalが記録される | Open |
| R-019 | ADRとstateの更新途中で停止し、不整合を有効な承認として扱う | Medium | High | 排他・変更前後の復旧記録・read-onlyでの未完了検出・各段階と復旧中のfailure injection（ADR-0007） | Maintainer / Approver | 残存journal、ADRとstateの不一致 | Locally mitigated; pending CI |
| R-020 | Accepted本文の改変や不正なSupersedeが再承認で隠れる | Medium | High | 本文と限定lifecycleの別照合、新旧関係・循環検証、記録なしADRの明示移行（ADR-0007） | Maintainer / Approver | 変更済みADRがComplete、置き換え途中でArchitecture承認成功 | Locally mitigated; pending CI |
| R-021 | shell補完で任意入力を評価したり、空白pathやshell差で壊れる | Medium | Medium | 候補をdataとして返し、実補完機構・引用引数・副作用なし・packed artifactを検証（ADR-0008） | Maintainer | 補完時のcommand実行、profile改変、shell間候補差 | Locally mitigated; pending CI |

## Current Focus

現在の対象は公開済みCLIのMaintenance。R-008 / R-009はartifact integration testと単一のTemplate正本で対策済みだが、Template変更時のRegression riskとして監視を続ける。

R-017の既存revision検証を維持し、R-019 / R-020 / R-021の対策をArchitecture Gateの承認後に実装した。Localでは復旧・競合・改変拒否とBash / PowerShellの実補完を検証済みで、Windows / Linux / 最低Node対応版のCIを公開前に確認する。R-018はlocal write権限を持つAgentの本人性を技術的に証明するものではないため、明示承認ルールとGit Reviewを継続する。監査要件があるProjectは署名やPR approvalを追加する。

R-016について、公開前のRepository設定確認時点ではGitHub Secret scanning / Push protectionが無効だった。今回の公開対象は内容Reviewし、設定変更は別途Maintainerが判断する。

公開状況は `milestones.md`、公開手順は `../operations/release.md` を参照する。対策済みでも公開後の検証前にRelease完了としない。

## Rules

- Probability / Impact は簡潔な尺度でよい。数値化が目的ではない。
- Ownerを明示し、誰も持たないRiskを作らない。
- 実装やIssueから重大Riskが見つかった場合はここへ昇格する。
- 解消済みRiskは削除せずStatusを更新する。
