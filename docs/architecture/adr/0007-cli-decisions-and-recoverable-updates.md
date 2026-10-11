# ADR-0007: CLIで明示判断を記録し、複数file更新を検出・復旧する

- Status: Accepted
- Date: 2026-10-11
- Supersedes: ADR-0006のAgent adapterによる承認記録と個別ADR照合の責務

## Context

REQ-011 / REQ-012を満たすには、人間とAIが同じGuardを使い、個別ADRを採用した内容と現在の内容を照合する必要がある。現行adapterとCLIではschema・placeholder・上流承認の検証が分かれており、ADRのStatusだけでは承認後の本文改変を検出できない。

ADRとstateの更新を別々にrenameするだけでは、途中失敗で不整合が生じる。ロックはCLI同士の更新競合を防げるが、editorの書き込みやプロセス異常終了まで解決しない。

要求・承認範囲の正本は `docs/product/requirements.md`、Scope / Risk / Release Gateは `docs/delivery/`。このADRは未承認の実装設計案であり、Current Architectureへの採用はArchitecture Gate後に行う。

## Decision

### 共通の読み取り・更新境界

既存TypeScript / Node.jsと標準libraryを維持する。schema・path・scope・dependency・UTF-8・placeholder・hashの処理をCLI内で共用し、承認操作、診断、移行、復旧へ適用する。

更新コマンドはProject rootを作業directoryとして使う。入口は要求に定めたapprove / rejectと、以下の安全な補助操作とする。

| 操作 | 対象と結果 |
| --- | --- |
| `control-plane migrate` | schema v1をv2へ明示移行する。v2ならno-op |
| `control-plane migrate adr 0001` | 個別記録のない既存Accepted、または既存Supersededの現在内容を人間が確認して照合記録を作る |
| `control-plane recover --complete` | 保存した更新後の内容へ未完了transactionを完了する |
| `control-plane recover --rollback` | 保存した更新前の内容へ未完了transactionを戻す |

対象省略の推測や暗黙のschema変換はしない。旧 `record-approval.mjs <item-id>` はインストール済み `control-plane approve <item-id>` を引数arrayで起動する互換入口とし、検証logicを削除する。CLIが見つからなければ導入手順を案内し、ネットワークへ自動fallbackしない。既存Projectへはadapter置換手順も提供する。

### state schema v2

既存の `revisionAlgorithm` とitems構造を維持し、`schemaVersion: 2` と `adr` を追加する。新TemplateのIDはRequirementsに従う。

`adr` は次を持つ。

- `directory`: ADRのRepository-relative directory。標準Templateは `docs/architecture/adr`。
- `architectureItem`: 最終確認を担うitem ID。参照先はArchitecture stageの唯一のitemとする。
- `dependsOn`: ADR採用の前提になるitem ID一覧。標準Templateは `["delivery"]` で、推移的にProduct / Constraintsを含む。Architecture itemへの依存や循環は拒否する。
- `decisions`: 4桁番号をkeyとする現在の照合情報。対象file path、記録種別、対象revision、必要な上流のscope・revision、限定lifecycleを除いたdecision revisionを保持する。

記録種別は `accepted`、`rejected`、`migrated-superseded`。通常approveと既存Acceptedの明示移行は `accepted` に記録し、移行で作った場合は `origin: migration` として過去の承認の復元と区別する。`rejected` は対象revisionと正規化した理由のhashを持ち、上流承認を要求せず、理由本文を複製しない。

上流scopeの集合が変わった場合も内容変更として扱う。Acceptedの記録では対象全体revisionを保持するため、上流だけの再承認がADR本文の改変を隠さない。履歴・承認者・承認日時の累積は追加しない。

番号解決とStatus解析を共用する。ADR directoryの直下だけを列挙し、numberに一致する全候補を検査して、一意性を確認してからregular file・Repository内path・schemaを検証する。symlinkやdirectoryを黙って除外して別候補を採用しない。Statusは文書先頭のmetadataに一意な `- Status: Proposed|Accepted|Rejected|Superseded` があることを要求し、code fence外の紛らわしい追加Statusも拒否する。理由やコード例のfence内の文字列はmetadataと解釈しない。

Architecture itemのinput directoryが宣言したADR directoryを漏れなく含み、templateとREADME以外のADRを任意に除外していないことを検証する。承認対象file、state、lock、journalの安全なpathを共通に検証し、Repository外へのsymlink、Windowsのabsolute path / drive-relative path、特殊fileを拒否する。既存の入力数・size制限を維持し、保存後のstateも読込制限を超えないことを更新前に確認する。

### ADR本文とlifecycleの照合

新TemplateのADR metadataに `- Superseded By: —` を追加する。新ADRの `Supersedes` は `—`、または一意な `ADR-NNNN` の参照一覧とする。旧ADRの `Superseded By` は単一の `ADR-NNNN` とする。参照の書き方と手順はADR READMEを正本として案内する。

初回採用時はAccepted変更後の全体hashとdecision hashを保存する。decision hashはLF正規化後、先頭metadata内の一意なStatusとSuperseded Byの行だけを定めた形式へ置換して計算する。それ以外の内容は1文字の変更でも照合対象とし、Supersedes、日付、本文の同名見出しなどを除外しない。

AcceptedのままのADRは全体hashの一致が必要。Supersededではdecision hashの一致に加えて次をすべて確認する。

- 旧ADRの記録が存在し、現在StatusがSupersededである。
- Superseded Byが一意な後続ADRを指し、その後続ADRがSupersedesで旧ADRを明示する。
- 後続ADRの採用記録と本文・上流照合が有効である。後続もSupersededなら同じ検証を辿り、最終的に現在有効なAcceptedへ到達する。
- 自己参照、曖昧な番号、循環、置き換え途中の片側参照がない。

新ADRの採用操作は旧ADRを編集しない。人間の採用後、AIが旧ADRのStatusとSuperseded Byだけを反映する。その間は診断で未完了を表示し、Architecture承認を拒否する。旧ADRの採用時の記録は維持し、過去の上流revisionに対する再承認を要求しない。Architecture itemの全体照合は実際の現在fileを含む。

### 却下理由の保存

理由の正規化はCRLF / CRからLFへの変換と両端の空白除去だけとする。空白だけ・NUL等の不正入力は拒否する。理由の本文は専用section内のMarkdown code fenceへ保存し、理由に含まれるbacktickの連続より長いfenceを選び、見出しやmetadataに見える入力が構造を壊さないようにする。

既存のRejection Reason欄が空のtemplate placeholderなら利用できる。内容入り・重複・曖昧な欄は上書きせず拒否する。再実行は保存済みADR全体revisionと理由hashの両方で検証する。

### 排他・復旧

更新前に `.control-plane/approval.lock` をexclusive createし、所有者のPID・host・ランダムなowner tokenを記録する。取得後に最新stateと対象を読み直す。取得に失敗したCLIは待たず終了し、自分のtokenと一致するlockだけを解放する。

単一stateの更新もADRとの更新も、同じtransaction処理を使う。検証済みの変更前・変更後のbytesとSHA-256、対象relative pathを `.control-plane/approval-transaction.json` に保存し、flushしてから対象を書き換える。byte照合用hashは文書revisionとは別で、改行も含む実bytesを照合する。journalはversioned・size boundedとし、最大8 MiB、書き込み先はstateと一意に解決した対象ADRに限定する。

対象は同じdirectoryのexclusive temporary fileへ保存・flushし、renameで置換する。変更直前に読取時点のbytesと再照合して、判明した外部編集を上書きしない。全対象の更新後bytesを確認した後でjournalを削除する。操作途中に失敗した場合はjournalを残す。editorとの完全な排他や任意のfilesystem・停電での保証は主張しない。

journalが残る間、approve / reject / migrateは新しい判断を書き込まない。next / doctorは診断と復旧コマンドの案内だけを行い、有効な承認と扱わない。

recoverはlock取得後、journalのschema・path・byte hashと、全対象の現在bytesを先に検証する。全対象が記録した変更前または変更後のいずれかに一致する場合だけ、指定方向へ復旧する。対象欠落、第三の内容、不正journalでは全対象を変更せず停止する。復旧途中の再失敗でもjournalを維持し、再実行できる。journalなしのrecoverはno-op。

異常終了でlockが残った場合、経過時間だけによる自動削除は行わない。同一hostのPIDの生存確認、所有者情報、全CLIを停止したことを人間が確認してから、そのlockだけを手動解除し、recoverを実行する手順を提供する。PIDが生存中・権限不足・別host・空または破損した所有者情報ではdeadと推測しない。再利用されたPIDでも安全側で拒否する。

lock / journal / temporary fileは生成TemplateのGit ignoreへ追加する。journalには対象文書のbytesが入るため、完了後に削除し、Git・packageへ収録しない。

### 既存Projectの移行

read-only診断と静的補完はschema v1にも対応し、移行前に使えるコマンドを案内する。v1へapprove / rejectは実行せず、明示的なmigrateを要求する。個別ADR記録がないことを診断で隠さない。

migrateはv1 definition・path・dependencyを検証し、唯一のArchitecture itemの宣言からadr.directoryとdependsOnを設定する。複数directoryや不明確な前提の場合は推測せず修正を案内する。item ID・label・依存と通常itemの既存照合情報は保持し、Architecture approvalは新しい個別ADR検証後に再確認するためnullへ戻す。通常itemの変更済みhashはそのままNeeds Reviewとして残す。

個別記録のないAcceptedは `migrate adr NNNN` により、上流がCompleteで対象が準備済みであることを確認し、現在の内容の照合情報を作る。本文とStatusを変えない。通常approveで記録なしAcceptedを採用し直さない。

既存Supersededは同じ明示移行入口で現在内容の全体revisionと参照を `migrated-superseded` として記録する。採用当時のhashを復元したと扱わず、以後の本文改変を検出する。最終Architecture承認時に後続の有効な採用と置き換え関係を検証する。Proposedは通常approve / rejectで処理し、既存Rejectedには通常rejectのno-opを暗黙に認めない。

product-goalからproduct-overviewへの任意改名は、ID・label・全dependsOn参照を一緒に変更し、affected itemsを再レビューする手動手順として案内する。schema移行と改名を自動で結び付けない。

## Consequences

### Positive

- 人間とAIの操作が共通Guardを通り、個別ADRの承認内容をArchitecture未承認の期間でも確認できる。
- 既存definitionを尊重し、現在の判断とGit上の履歴を分けられる。
- 同時更新・途中失敗・本文改変がGateを黙って通過することを防ぐ。

### Negative / Trade-offs

- schema移行と追加の照合記録が必要になり、既存Projectは明示的な確認を行う。
- 複数file更新・復旧にはintegration testとWindowsでの検証が必要になる。
- stale lockや第三の内容への編集は自動修復できず、人間が状況を確認する必要がある。

## Alternatives Considered

### adapterに検証を追加し続ける

Guardが二重になり、人間の直接CLIと同じ安全性を保ちにくいため採用しない。

### Statusだけ、またはADR directory全体の最終承認だけで検証する

個別採用からArchitecture承認までの本文改変と、上流だけの変更を区別できないため採用しない。

### 単一file renameだけで複数fileを更新する

中断時の不整合を検出・復旧できないため採用しない。Git自動commitやdatabase transactionはCore contractへ新たな依存を加えるため導入しない。

### lockの期限切れを自動解除し、読取操作で復旧する

稼働中処理のlock削除やread-only contractの変更につながるため採用しない。

## Validation

現時点では設計案であり、以下を実装前のREDから確認する。

- 項目順序・未知ID・TODO / placeholder・path escape / symlink・schema・UTF-8・no-op・CLIの表示とexit status。
- 対象ADRだけの遷移、番号重複、Status重複、上流だけの再承認、本文改変拒否、理由の安全な保存と再実行。
- 採用済み / 移行した旧ADR、正当なSupersede・本文改変・循環・途中停止・連続した置き換え。
- 実プロセスの同時実行、各transaction段階と復旧中のfailure injection、残存lock、journal改変、第三の内容での全更新拒否。
- v0.3 state / adapterからの移行、既存IDとProject固有ID、packed artifactからの同じフロー。
- 関連テスト、`scripts/check.*`、Windows / Linux / Node最低対応版CI。
