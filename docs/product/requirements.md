# Requirements

このファイルは、プロダクト要求と Acceptance Criteria の Source of Truth です。

## Requirements

### REQ-001: Template initialization

**Statement**

利用者は、新しいDirectoryへControl Plane Templateを展開できる。

**Acceptance Criteria**

- [ ] `control-plane init <directory>` が新規ProjectへTemplate assetを配置する。
- [ ] CLI内部にTemplate本文を重複して埋め込まない。
- [ ] 既存Directoryを破壊的に上書きしない。
- [ ] 初期化後のProjectが既存Control Plane validation contractを利用できる。
- [ ] npm配布物から初期化したProjectにも、正本と同じ内容の `.gitignore` が配置される。
- [ ] 開発時とnpm配布時に、同じstaging済みTemplateを使う。
- [ ] Templateの未追跡・ignored fileをbuild・配布対象へ含めない。
- [ ] TemplateへのCredentialに相当するpathとSymbolic linkの混入は、buildを失敗させる。
- [ ] Control Plane製品固有の完成例を、新規Projectの生成物へ含めない。

**Out of Scope**

- Remote repository作成
- Project-specific application scaffold

### REQ-002: Repository diagnosis

**Statement**

利用者は、現在のRepositoryがControl Planeとしてどの状態にあり、何が不足しているかを確認できる。

**Acceptance Criteria**

- [ ] `control-plane doctor` が主要なControl Plane assetの存在を診断する。
- [ ] Bootstrap Preparation / Architecture Gate Pending / Bootstrap Complete等、Repositoryから安全に判定できる状態を表示する。
- [ ] 不足項目を人間向けに説明し、次Actionを提示する。
- [ ] 判定できない状態を推測で確定しない。
- [ ] Bootstrapの進捗は、Repository上のmachine-readableなCurrent Stateに記録された明示的人間承認を主条件として判定する。
- [ ] 独立した `TODO` / `TODO:` は承認準備未完了として検出し、`TODOList` / `MY_TODO` 等の識別子は検出しない。境界はASCII英数字・underscore以外とする。
- [ ] Placeholderがないことだけで項目を `Complete` にしない。
- [ ] 承認時点の対象inputと現在内容のrevisionが一致する場合だけ `Complete` とする。
- [ ] 承認後に対象inputまたは上流dependencyが変更された項目は `Needs Review` とする。
- [ ] 新規生成直後の `next` は全5項目を `Pending` とし、Constraintsも `Work On` と依頼文へ含める。
- [ ] Shell / PowerShellのplaceholder検証も同じ大小文字・境界のルールを使う。

### REQ-003: Validation execution

**Statement**

利用者は、CLIからProjectの既存Validation Entry Pointを実行できる。

**Acceptance Criteria**

- [ ] `control-plane check` が対象Platformで利用可能な `scripts/check.*` を実行する。
- [ ] Validation logicをCLIへ再実装しない。
- [ ] Exit statusを呼び出し元へ正しく伝播する。
- [ ] 実行対象がない場合は診断可能なErrorを返す。

### REQ-004: Preserve durable truth boundaries

**Statement**

CLI導入後も、Template / Workflow / ADR / Validation contractをDurable Truthとして維持する。

**Acceptance Criteria**

- [ ] CLI codeがRequirementsやWorkflow本文の別SSOTにならない。
- [ ] CLIが変更されたとき、必要なDurable documentationだけが更新される。
- [ ] Agent-specific adapterを導入してもVendor-specific configを正本にしない。

### REQ-005: Cross-platform CLI contract

**Statement**

CLIは主要Desktop development environmentで利用できる設計とする。

**Acceptance Criteria**

- [ ] WindowsとLinuxを初期対象としてTechnology候補を比較する。
- [ ] macOSを阻害する設計を避ける。
- [ ] PlatformごとのValidation script差異をCLIが吸収できる。

### REQ-006: Safe repository migration

**Statement**

CLI化に伴うRepository再編で、既存Templateの意味と利用方法を破壊しない。

**Acceptance Criteria**

- [ ] 生成先用Template assetとcontrol-plane自身のProduct assetの責務を分離する案が定義される。
- [ ] 移行前後でTemplateに必要なassetが欠落しない検証方法を持つ。
- [ ] Repository再編はArchitecture Gate承認後に行う。

### REQ-007: Minimal initial scope

**Statement**

CLIは導入・診断・次Action案内・検証、明示的な承認・却下、その安全な移行・復旧、shell補完に限定し、必要性が未実証の機能を追加しない。承認操作はREQ-011、移行・復旧はREQ-012、補完はREQ-013を正本とする。

**Acceptance Criteria**

- [ ] `status / update / report / estimate` は現在のScopeに含めない。
- [ ] `control-plane.yml`、Project Profile、Plugin system、Subagentsを必須要素にしない。

### REQ-008: Read-only next-step guidance

**Statement**

利用者は、RepositoryからBootstrapの現在地、Human Gate、通常開発への移行、次Actionを決定論的に確認できる。

**Acceptance Criteria**

- [ ] `control-plane next [directory]` はRepositoryを変更しない。
- [ ] `control-plane bootstrap [directory]` は後方互換のAliasとして `next` と同じ結果を返す。
- [ ] Projectのstateに定義された項目名で進捗を表示する。新Templateの命名はREQ-011に従い、既存ProjectのID・labelも尊重する。
- [ ] 文書準備が必要なBootstrap In Progressでは、`Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、人間が次に触る具体的なRepository pathを確認できる。schema v2の準備済み項目は `Approval Pending` と実行コマンドを表示し、文書の再編集を指示しない。
- [ ] `Suggested Instruction` はAI Agentへ単体でコピーして意味が通るよう、対象pathを明示し、「上記ファイル」等の外部文脈依存表現を使わない。
- [ ] `Suggested Instruction` は `AGENTS.md` と関連Workflowへの入口、現在のObjective、Work Scope、Stop Conditionに限定し、Workflow本文を重複しない。
- [ ] Product Definition / Delivery Framing / Architecture Preparation / Architecture Gate / Bootstrap Finalization / Ongoing DevelopmentをRepository状態から段階的に案内し、完了済み項目を次のWork Scopeへ含めない。
- [ ] Proposed ADRがArchitecture Gate待ちなら、対象ADRをHuman Gateとして表示する。
- [ ] Human Gateでは、Decisionの判断材料となる主要なRepository SSOTを `Review Inputs` として表示する。
- [ ] Human Gateでは、承認対象となるADRのRepository pathを `Decision` として表示し、`Suggested Instruction` より人間の判断を優先する。
- [ ] Approvalは表示項目またはDecision Gate単位で扱い、対象fileは承認時点のinput fingerprintとして紐づける。
- [ ] Product / Delivery文書本文へ承認metadataを追加せず、Bootstrap Current Stateを承認状態のSSOTとする。
- [ ] `next` / `doctor` はHuman Gateの承認・却下を実行せず、対象の番号・タイトル・Repository pathと、人間が実行するコマンドを表示する。
- [ ] AI Agentによる承認操作もREQ-011の明示承認ルールと共通CLIを使う。
- [ ] Bootstrap Current Stateは現在状態だけを保持し、Approval historyや議事録を保持しない。変更履歴はGitへ委ねる。
- [ ] `next` と `doctor` はBootstrap Current Stateをread-onlyで検証し、Repositoryを変更しない。
- [ ] 同じRepository状態から同じ判定と固定メッセージを返し、AI APIを利用しない。
- [ ] 短い英語ラベルと日本語説明を組み合わせる。

**Out of Scope**

- `next` / `doctor` によるRepositoryの自動更新
- 人間の明示的な判断を伴わないADRの自動承認・却下
- AI/LLMによる文面生成
- Approval history管理
- Issue番号の自動取得・推測
- 通常開発全体のPrompt generator
- `status` command
- `--lang` / `--json`

### REQ-009: AI-assisted effort comparison

**Statement**

利用者は、AI Agentと協働するProjectのDelivery Estimateで、AIの実行時間、人間の関与時間、人間のみで実施した場合の参考工数を分けて比較できる。

**Acceptance Criteria**

- [ ] `template/docs/delivery/estimate.md` が `AI Agent Elapsed` / `Human Involvement` / `Human-only Equivalent` を別々に記録できる。
- [ ] `AI Agent Elapsed` をHuman laborとして扱わない。
- [ ] `AI Agent Elapsed` と `Human Involvement` を総工数として単純合算しない。
- [ ] `Human-only Equivalent` は同じScopeと品質条件を前提とした比較用Estimateとして扱う。
- [ ] Human-only Equivalentが実測でない場合、AssumptionsとConfidenceを明示する。
- [ ] Bootstrap WorkflowがAgentへ同じ見積もりルールを指示する。

### REQ-010: Ongoing development bridge

**Statement**

利用者は、Bootstrap完了後も `control-plane next` からIssue-drivenな通常開発へ迷わず移行できる。

**Acceptance Criteria**

- [ ] Bootstrap Completeでは `Next Step: Ongoing Development` を表示する。
- [ ] 変更要求の標準Intakeとして `GitHub Issue` を案内する。
- [ ] `Suggested Instruction` は `AGENTS.md` と `agent/workflows/issue.md` を入口として参照する。
- [ ] 利用者が `<ここに変更したい内容を書く>` を置換してAI Agentへ渡せる固定Instructionを表示する。
- [ ] InstructionはIssue作成後にRequirements / Constraints / Architecture / Cost / Risk / TimelineへのImpact Analysisを求める。
- [ ] Architecture Decision変更が必要な場合は新ADRを `Proposed` として準備し、実装前のHuman Gateで停止するよう案内する。
- [ ] CLI自身はIssueを作成せず、Issue番号や変更内容をRepository状態から推測しない。
- [ ] Bootstrap Complete状態でも `control-plane check` によるValidation導線を維持する。
- [ ] Workflow本文はCLIへ複製せず、詳細はRepository上のIssue WorkflowをSource of Truthとする。

### REQ-009: Readable terminal output

**Statement**

利用者は、CLIの状態と次Actionを端末で視覚的に識別でき、装飾のない出力も利用できる。

**Acceptance Criteria**

- [ ] `init / doctor / next / bootstrap / check / --help` と引数Errorで共通の意味付けを使う。
- [ ] 成功・完了は緑、未完了・承認待ちは黄、要確認は黄＋太字、実行失敗・必須asset欠落は赤、見出し・次Stepはシアン＋太字。
- [ ] 色がなくても状態が理解できる文字・記号を残す。パス、説明、`Suggested Instruction` 本文は装飾しない。
- [ ] stdout / stderrのTTYを個別に判定し、非TTY、CI、`TERM=dumb` は既定で装飾しない。
- [ ] `NO_COLOR` / `NODE_DISABLE_COLORS` の非空値、`FORCE_COLOR=0`、全コマンド共通の `--no-color` で無効化する。明示的な非空・非0の `FORCE_COLOR` はTTY / CI制限を上書きできるが、無効化指定を優先する。
- [ ] `--no-color` は前後どちらでも指定でき、`check` のchild processにも伝達する。
- [ ] 色の有無で診断結果・案内本文・終了コードを変えない。`--version` は常に番号だけを装飾なしで表示する。
- [ ] `check` は選択scriptと開始・成功／失敗を表示し、child logは変更せず継承する。
- [ ] 実行時依存を追加せず、Node.js 22の最低対応版でも動作する。

### REQ-011: Explicit item and ADR decisions

**Statement**

人間は文書を確認し、対象を明示したCLIでBootstrap項目と個別ADRの承認・却下を記録できる。実行時点の内容を承認し、設計判断の採用と現在設計への反映確認を分ける。

**Acceptance Criteria**

- [ ] Project rootで `control-plane approve <item-id>`、`control-plane approve adr <adr-number>`、`control-plane reject adr <adr-number> --reason "<理由>"` を実行できる。対象は必須で、推測や一括承認をしない。
- [ ] 項目・input・dependencyはProjectのmachine-readable definitionから取得し、CLIへ標準5項目や文書名を固定しない。
- [ ] 新Templateは `product-overview` / `Product Overview` を標準ID・labelとし、overview.md全体の承認を表す。依存参照・表示・Workflow・テストを整合させる。命名は承認内容のまとまりと範囲を表す。
- [ ] 項目承認は対象と推移的な上流inputのscope・hashを記録する。同一内容の再承認は成功扱いのno-opとし、通常itemの内容変更後は同じコマンドで再承認できる。
- [ ] 未知ID、不正schema、欠落対象、Repository外path、TODO・必須placeholder、現在revisionに対してCompleteでない上流を拒否する。検証失敗では対象fileとstateを変更しない。
- [ ] ADR番号は4桁とし、ADR directory直下の `NNNN-*.md` から一意に解決する。該当なし・重複・`0000`、template・README、不正pathを拒否する。重複時は候補file名を表示する。
- [ ] ADRのStatusが欠落・重複・曖昧な場合は拒否する。初回approveは指定ProposedだけをAcceptedへ変更し、他のADRやArchitecture項目を承認しない。
- [ ] ADRの承認では宣言された上流の有効な承認と対象の必須記述を要求し、Status変更後のADRと上流inputの照合情報を記録する。Bootstrap後も同じ操作を利用できる。
- [ ] 有効なAccepted ADRへの同一承認はno-op。ADRが変更されず上流だけが変更された場合は、上流の再承認後に同じapproveコマンドで照合情報を更新し、ADR本文・Statusを維持する。
- [ ] Accepted ADR自体が改行正規化以外で変更されていれば再承認を拒否する。元の内容へ戻すか、新しいADRでSupersedeするよう案内する。Rejected / SupersededをAcceptedへ戻さない。
- [ ] 上流変更でADRのStatusを自動でProposedへ戻さない。Architecture未承認の期間でもAccepted ADRの内容・前提変更を検出し、`next` / `doctor` で再レビューを案内する。
- [ ] rejectは指定ProposedだけをRejectedへ変更し、空白だけでない理由をADRの専用 `## Rejection Reason` 欄へ保存する。上流未承認・Needs Reviewでも却下できる。対象・path・Statusの検証は維持する。
- [ ] 却下理由欄の重複・曖昧さや既存の理由を黙って上書きしない。Rejectedの同一内容・同一理由での再実行はno-op。異なる理由や却下後のADR変更では拒否し、別のレビューとGit上の訂正を案内する。
- [ ] 却下内容の照合情報をstateへ記録するが、理由本文をJSONへ複製しない。承認履歴・議事録をstateへ蓄積しない。
- [ ] CLIはStatus、却下理由欄、機械的な承認記録だけを更新し、設計本文やCurrent Architectureを生成しない。
- [ ] 人間が新しいADRを承認した後、AIが旧ADRのStatusと所定の置き換え参照だけを更新できる。本文・過去の判断理由や承認記録を取り直さず、限定した正当なlifecycle変更だけを検証する。
- [ ] 新旧の置き換え関係に自己参照・番号重複・曖昧な参照・循環・途中停止・本文改変があれば、Architecture最終承認を拒否する。旧ADRの採用時の記録は保持し、有効な新ADRの承認を要求する。
- [ ] Architecture承認は、未解決Proposed、無効なADR承認、未完成のCurrent Architectureがあれば拒否する。人間が採用判断の反映結果を確認してから実行する。
- [ ] AIは人間の対象を特定した明示承認を受けて同じCLIを実行する。曖昧な指示は確認し、無言・会話終了・AIの品質判断を承認にしない。旧adapterは共通CLIへ委譲し、Guardを二重実装しない。
- [ ] 成功時は対象・変更結果・更新file・次Actionを、拒否時は理由・解消方法を表示する。上流だけのADR再承認ではStatus維持と承認記録の更新を明示する。itemの案内にはlabelと対象fileを含める。
- [ ] 承認は内容の妥当性や実行者の本人性を自動証明しない。ADR承認やBootstrap完了後も、実装開始にはIssue Workflowの影響分析とDecision Gateを適用する。
- [ ] 新規生成Projectとpacked npm artifactで同じ承認・却下・再承認・Architecture Gateが成立し、関連テストと `scripts/check.*` が成功する。

**Out of Scope**

- `review`、`revoke`、`approve --all`、必須の `--revision`、ADRのfile path指定、フォルダ連番変更
- AI API・GitHub認証・署名・PR approvalのCore contractへの必須化
- レビュー中の対象文書の並行編集。人間のレビュー中はAIによる更新を止める運用とする。

### REQ-012: Explicit approval migration and recovery

**Statement**

既存Projectを明示的に移行でき、CLI同時実行や途中失敗で判断記録を失ったり、不整合を有効な承認と扱ったりしない。

**Acceptance Criteria**

- [ ] CLI更新やread-only診断だけでProject assetを自動更新しない。既存 `product-goal` とProject固有IDをstate定義に従って扱い、固定aliasや同一内容の重複itemを追加しない。
- [ ] schema移行の操作と検証手順を文書化する。ID・dependsOnの変更は任意の別操作として明示し、移行で勝手に変更しない。
- [ ] 個別記録のない既存Accepted ADRは通常approveや起動処理で暗黙に承認せず、人間が対象と現在の上流を確認する明示的な移行操作で照合情報を作る。上流の有効な承認を要求し、本文・Acceptedを維持する。
- [ ] 移行記録は現在内容の確認を表し、過去の承認時点・本人性の復元としない。既存Superseded履歴の移行でも採用時の証拠を捏造しない。
- [ ] 全更新操作と互換adapterは同じ排他・検証・復旧処理を通す。ロック取得後にstateを読み直し、他CLIが更新中なら変更せず終了する。
- [ ] 単一fileを一時fileと置換で更新する。ADRとstateの複数file更新には検出可能な復旧記録を使い、途中失敗を黙って有効扱いしない。
- [ ] 未完了更新を `next` / `doctor` がread-onlyで検出する。復旧は明示的な操作で、記録した変更前後に一致する場合だけ完了または復元できる。
- [ ] 復旧記録と対象が一致せず別の編集が入っている場合は上書きせず停止する。復旧記録自体のschema・path・hashも検証する。
- [ ] ロックの経過時間だけで稼働中プロセスのロックを削除しない。異常終了後の解除条件と、所有者の生存を判定できない場合の手順を文書化する。
- [ ] v0.3 Projectの移行、変更を失わない競合、各更新段階の途中失敗、復旧中の再失敗、外部編集での復旧拒否をintegration testで検証する。

### REQ-013: Bash and PowerShell completion

**Statement**

利用者はBashとPowerShellの標準Tab補完機構で、入力位置とprefixに合ったCLI候補を取得できる。

**Acceptance Criteria**

- [ ] 両shellで有効化・解除でき、セッション限定と設定file / profileでの継続利用の手順、対応versionを文書化する。CLIが設定fileを自動編集しない。
- [ ] 実装済みコマンド、各コマンドの有効なオプション、引数位置に合った候補を返す。`in` はinit、`approve req` はrequirementsへ補完できる。
- [ ] approveのitem候補はstateから取得し、承認状態で隠さない。新Template・旧Project・Project固有IDを扱い、`adr` も提示する。rejectの対象候補は `adr` とする。
- [ ] ADR番号を承認・却下と共通の番号解決処理で取得し、prefixで絞る。挿入値は4桁番号だけとし、可能なshellではタイトルを説明に表示する。
- [ ] template・README・0000・番号重複をADR候補から除外する。Statusによる候補絞り込みは必須にしない。
- [ ] directory引数はshell標準のdirectory補完を使い、空白を含むpathと引用された引数を両shellで扱う。
- [ ] 候補1件・複数件・なしは各shell標準の補完動作に従う。キー操作や候補表示形式の完全一致を要求しない。
- [ ] Project外・state欠落・不正でも動的候補は空になり、静的補完を維持する。Tab操作のたびに通常診断やstack traceを表示しない。
- [ ] 候補取得はoffline・read-onlyで、承認・却下・checkや復旧を実行しない。却下理由等の自由入力本文は生成しない。
- [ ] CLIのコマンド・オプション定義と候補取得を共用し、shellへ承認対象の知識を複製しない。
- [ ] BashとPowerShellの実際の補完機構、packed npm artifact内の補完asset、関連テストと `scripts/check.*` で検証する。

**Out of Scope**

- Zsh / Fish

承認機能と補完は独立した受入対象とする。採用した設計判断はADR-0007 / ADR-0008、公開完了条件は `docs/delivery/milestones.md` を参照する。
