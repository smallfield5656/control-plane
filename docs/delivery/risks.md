# Risks

プロジェクトの主要Riskと対応方針を管理するSSOT。

## Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner | Trigger / Signal | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Repository再編で既存Template assetが欠落・参照切れする | Medium | High | Migration前後のinventoryとgolden-path validationを用意する | Maintainer | check失敗、README/Workflow参照切れ | Open |
| R-002 | CLIにWorkflow/Validation logicが重複しSSOTが分裂する | Medium | High | CLIはTemplate/Workflow/scriptsを呼ぶ薄いInterfaceに限定する | Maintainer | 同じRuleがCLI codeとdocs/scriptsの両方に現れる | Open |
| R-003 | CLI technologyを早期固定しdistribution/保守で不利になる | Medium | Medium | Requirements/Constraints後に複数候補をADRで比較する | Maintainer | 特定runtime前提の実装開始 | Open |
| R-004 | `control-plane.yml` やProfileを先行導入し不要なschemaを固定する | Medium | Medium | 初期MVPでは必須化しない | Maintainer | init/doctor/checkだけでは使わない設定項目が増える | Open |
| R-005 | Cross-platform behaviorの差でcheck実行やpath処理が壊れる | Medium | High | Windows/Linuxでintegration test、path/process abstractionを検証する | Maintainer | Platform固有test失敗 | Open |
| R-006 | doctorがRepository状態を過度に推測し誤診する | Medium | Medium | 判定根拠を明示し、不明状態はUnknownとして扱う | Maintainer | 実状態とdoctor表示が不一致 | Open |
| R-007 | CLI scopeがAgent runtime/Plugin/Harnessへ拡大しMVPが肥大化する | Medium | Medium | init/doctor/check以外をOut of ScopeとしてGateする | Maintainer | 新コマンドやadapter追加要求 | Open |

## Rules

- Probability / Impact は簡潔な尺度でよい。数値化が目的ではない。
- Ownerを明示し、誰も持たないRiskを作らない。
- 実装やIssueから重大Riskが見つかった場合はここへ昇格する。
- 解消済みRiskは削除せずStatusを更新する。
