# ADR-0006: 明示的人間承認をBootstrap Current Stateへ記録する

- Status: Accepted
- Date: 2026-10-11
- Supersedes: —

## Context

`control-plane next` はProduct / Delivery文書のplaceholderや固定文字列からBootstrap進捗を推定している。Placeholderを除去しただけで人間がレビューしていない項目も `Complete` になり、人間がAI Agentへ明示した承認はRepository上に表現されない。

CLIへAI APIを組み込まず、特定vendor、Network、Hosted serviceへ依存せずに、人間のDecision Gateを次Step判定へ反映する必要がある。また、承認後の内容変更で古い承認が残らないこと、同じRepository状態から同じ結果を返すことが必要である。

## Decision

- `.control-plane/bootstrap-state.json` をBootstrap workflow definitionと現在の承認状態の機械可読なSSOTとする。
- 承認単位はProduct Goal / Requirements / Constraints / Delivery / Architectureの表示項目またはDecision Gateとし、Markdown file自体へ承認metadataを埋め込まない。
- 各項目はinputと上流dependencyを宣言する。承認時には対象項目のtransitive inputについて、LFへ改行を正規化したUTF-8 textのSHA-256を記録する。
- 承認がない項目は `Pending`、記録されたhashと現在内容が一致する項目だけを `Complete`、承認後に自身または上流inputが変わった項目を `Needs Review` とする。
- Architecture項目はADR directoryもinput scopeに含める。Proposed ADRのArchitecture Gateと `Accepted / Rejected / Superseded` のDecision historyは既存contractを維持する。
- AI Agentは人間の明示的な承認を受けた場合だけ、Project Bootstrap Skillのadapter scriptを使ってCurrent Stateを更新する。CLIの `next` と `doctor` はread-onlyを維持する。
- Current Stateは現在の承認だけを保持し、承認者の本人性やApproval historyを証明しない。履歴はGitへ委ね、監査要件があるProjectは署名やPR approvalをProject固有要件として追加する。
- state fileがない既存Projectへlegacy推定でfallbackしない。`Setup Incomplete` とmigration guidanceを返す。
- schema version、path、dependency graph、input path、hashを保守的に検証し、不正または曖昧な状態では先へ進めない。

## Consequences

### Positive

- 人間が承認していない文書を内容の有無だけで完了扱いしない。
- 承認後の変更と上流変更を決定論的に検出できる。
- CLIをAI vendor、Network、GitHubへ依存させず、Repository-firstな運用を維持できる。
- Workflow item、順序、input、dependencyをCLI codeから分離できる。

### Negative / Trade-offs

- Templateと既存Projectへ新しいmachine-readable assetが必要になる。
- 既存Projectはstate fileを追加し、現在の内容を再承認するまで新しい判定で先へ進めない。
- Current Stateを書けるAgentは承認記録も変更できるため、人間本人性の暗号学的証明にはならない。
- 改行以外のformat変更でもhashが変わり、再レビューが必要になる。安全側の挙動として受け入れる。

## Alternatives Considered

### Markdown frontmatterへStatusを埋め込む

内容変更後も `Approved` が残りやすく、Product / Delivery本文とworkflow stateの責務が混在するため採用しない。

### CLIがAI APIへ問い合わせる

Offline、determinism、vendor-neutral、Credential不要という制約を壊し、人間の明示的承認を保証しないため採用しない。

### GitHub PR approvalを必須にする

監査証跡としては強いが、local / offline ProjectへHosted serviceを強制するためCore contractにはしない。

### Placeholder判定を継続する

文書準備と人間承認を区別できないため採用しない。Placeholder検出は承認準備checkとしてのみ残す。

## Validation

- 未承認文書はplaceholderがなくても `Pending` になる。
- 明示承認とrevision一致でだけ `Complete` になる。
- 自身または上流input変更で `Needs Review` になる。
- Proposed ADRは自動承認されずArchitecture Gateで停止する。
- state欠落、不正schema、Repository外path、循環dependencyを安全側で拒否する。
- packed npm artifactから生成したProjectにも同じstate contractとAgent adapterが含まれる。
