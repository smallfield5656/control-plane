# @smallfield5656/control-plane

AI-assisted software projects向けのEngineering Control Plane CLIです。

## Quick Start

```bash
npx @smallfield5656/control-plane init my-app
cd my-app
npx @smallfield5656/control-plane next .
npx @smallfield5656/control-plane check .
```

npm package名は `@smallfield5656/control-plane`、実行されるCLI bin名は `control-plane` です。

`init` はControl Plane Templateを新規Directoryへ展開します。既存Directoryは上書きしません。

`next` はRepositoryを変更せず、`.control-plane/bootstrap-state.json` の明示的人間承認と現在revisionから次にやるべきことを決定論的に案内する主コマンドです。Bootstrap中は `Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、Architecture Gateでは `Review Inputs` / `Human Gate` / `Decision` を表示して人間の判断を優先します。

Bootstrap完了後は `Next Step: Ongoing Development` と `Change Intake: GitHub Issue` を表示し、`AGENTS.md` と `agent/workflows/issue.md` を入口にした変更要求用の `Suggested Instruction` を案内します。CLI自身はIssueを作成せず、変更内容やIssue番号を推測しません。

`bootstrap` は `next` の後方互換Aliasです。

人間は文書を確認して `approve` / `reject` で判断を記録できます。人間から対象を特定した明示承認を受けたAIも同じCLIを使います。CLIはAI APIを利用せず、`next` / `doctor` はread-onlyです。詳細WorkflowはProjectの `AGENTS.md` と関連Workflowを参照します。

## Commands

```text
control-plane init <directory>
control-plane doctor [directory]
control-plane next [directory]
control-plane bootstrap [directory]  alias for next
control-plane check [directory]
control-plane approve <item-id>
control-plane approve adr <number>
control-plane reject adr <number> --reason "<reason>"
control-plane migrate [adr <number>]
control-plane recover --complete | --rollback
control-plane completion <bash|powershell>
control-plane --help
control-plane --version
```

Template / Workflow / Validation contractがDurable Truthであり、CLIはそれらを操作する薄いInterfaceです。

## Terminal Output

成功は緑、未完了・承認待ちは黄、エラーは赤、見出しと次の作業はシアンで表示します。文字と記号でも状態を識別できます。

TTYを自動判定し、パイプ・ファイル保存・CIでは既定で色を付けません。`NO_COLOR=1` または `--no-color` で無効化できます。

```bash
control-plane next --no-color
control-plane --no-color doctor
control-plane check --no-color
```

`--no-color` は検証の子プロセスにも伝わります。`FORCE_COLOR=1` は明示的な着色に使えますが、無効化指定を優先します。`--version` とコピー用の依頼文は常に装飾しません。

独立した `TODO` / `TODO:` が文書に残っている項目は承認準備未完了として扱います。Placeholderがなくなっただけでは `Complete` になりません。制約がない場合は `なし` と理由を記載してください。

## Approval Flow

Project rootで `control-plane next` に表示された対象と文書を確認します。新Templateの例:

```bash
control-plane approve product-overview
control-plane approve requirements
control-plane approve constraints
control-plane approve delivery
control-plane approve adr 0001
```

ADR採用後、AIが判断を `ARCHITECTURE.md` へ反映し、人間が `control-plane approve architecture` で全体を確認します。item IDはProjectのstateから取得し、独自ID・既存IDも使えます。対象省略や一括承認はありません。レビュー中はAIによる対象の編集を止めてください。

上流だけが変更されたAccepted ADRは、上流を再承認してから同じapprove adrで再確認できます。ADR本文の変更は再承認できません。方針変更は新ADRでSupersedeし、採用後に旧ADRのStatusとSuperseded Byだけを反映します。操作とmetadataはProjectの `docs/architecture/adr/README.md` を参照してください。

```bash
control-plane reject adr 0001 --reason "別案を検討するため"
```

却下は上流未承認でも可能です。理由はADRのRejection Reason欄に保存し、同じ内容・理由の再実行はno-opになります。異なる理由や変更済みADRを再実行で上書きしません。承認は内容の妥当性や本人性の自動証明ではありません。

## Existing Project Migration

CLIの更新だけでProject assetは変わりません。v0.3のstateには明示移行が必要です。

```bash
control-plane migrate
control-plane next
```

既存のitem ID、label、dependency、通常itemの照合情報を保持します。`product-goal` はそのまま有効です。Architecture承認は個別ADRの確認後に取り直すため未承認へ戻ります。変更済みの上流は依存順に再承認してください。

個別記録のないAccepted / Supersededを現在の上流とともに確認し、対象ごとに実行します。

```bash
control-plane migrate adr 0001
```

ADR本文とStatusは維持します。これは現在の内容を確認した記録で、過去の承認時点・本人性は復元しません。通常approveでは記録なしAcceptedを暗黙に承認しません。既存Supersededは後続への一意なSuperseded Byと対応するSupersedesも確認してください。

旧record-approval.mjsを使うProjectは、新Templateの `.agents/skills/project-bootstrap/scripts/record-approval.mjs` へ明示的に置き換え、Bootstrap Skill / WorkflowとADR READMEもレビューして反映してください。互換入口はインストール済みCLIへ委譲するため、CLIをPATHから利用できるようにします。CLIはv0.4以上を要求し、旧adapterをそのまま使ってGuardを迂回しないでください。

IDをproduct-overviewへ任意に改名する場合は、stateのid・labelと全dependsOn参照を一緒に変更し、影響項目を再確認・再承認してください。schema移行はIDを自動改名せず、固定aliasもありません。

## Interrupted Update Recovery

CLI同士の同時更新は `.control-plane/approval.lock` で排他します。未完了の `.control-plane/approval-transaction.json` がある場合、新しい承認は止まり、next / doctorが復旧を案内します。

変更前後の内容を確認し、更新を完了するか、元に戻すかを選びます。

```bash
control-plane recover --complete
# または
control-plane recover --rollback
```

全対象がjournalに保存した変更前または変更後の内容に一致する場合だけ復旧します。別の編集、対象欠落、不正journalでは上書きせず停止します。editorの直接編集まで排他する仕組みではありません。

異常終了でlockが残った場合は、lockのhost・pid・tokenを読み、同一hostのPIDを `ps -p <pid>` またはPowerShellの `Get-Process -Id <pid>` で確認します。PID不在だけで別hostやPID再利用を判断せず、他のCLIも停止したことを確認してから、対象Projectの `.control-plane/approval.lock` だけを手動で削除し、recoverを実行してください。所有者不明、別host、生存中、権限不足の場合は管理者と確認してください。CLIは時間経過だけでlockを削除しません。journalには文書の内容が入るためGitへ追加しないでください。

## Shell Completion

Bash 4以上（WSLを含む）とPowerShell 7.2以上に対応します。Zsh / Fish / Windows PowerShell 5.1は対象外です。PATHから `control-plane` を利用できる環境で有効化します。

```bash
npm install -g @smallfield5656/control-plane
source <(control-plane completion bash)
# 解除
complete -r control-plane
unset -f _control_plane_complete
```

継続利用する場合はBash設定fileへsourceの行を自分で追加します。解除時はその行も削除してください。

```powershell
control-plane completion powershell | Out-String | Invoke-Expression
```

PowerShellの継続利用は同じ行を自分の `$PROFILE` へ追加します。解除時はその行を削除して新しいセッションを開きます。PowerShellにはArgumentCompleterの標準解除コマンドがないため、セッション内の解除も新しいセッションを使います。CLIがprofileを書き換えることはありません。

`control-plane in<Tab>`、`approve req<Tab>`、`approve adr 000<Tab>` で入力位置とprefixに合う候補を取得できます。item IDはstateから取得し、番号重複・0000はADR候補から除外します。directory引数は空白pathと引用を扱い、複数候補の選択は各shellの標準操作に従います。補完はoffline・read-onlyで、承認・検証・復旧を実行しません。
