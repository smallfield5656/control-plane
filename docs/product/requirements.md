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
- [ ] 独立した `TODO` / `TODO:` は未完了として検出し、`TODOList` / `MY_TODO` 等の識別子は検出しない。境界はASCII英数字・underscore以外とする。
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

CLIは `init / doctor / next / check` と `bootstrap` 互換Aliasに限定し、必要性が未実証の機能を追加しない。

**Acceptance Criteria**

- [ ] `status / update / report / estimate` は現在のScopeに含めない。
- [ ] `control-plane.yml`、Project Profile、Plugin system、Subagentsを必須要素にしない。

### REQ-008: Read-only next-step guidance

**Statement**

利用者は、RepositoryからBootstrapの現在地、Human Gate、通常開発への移行、次Actionを決定論的に確認できる。

**Acceptance Criteria**

- [ ] `control-plane next [directory]` はRepositoryを変更しない。
- [ ] `control-plane bootstrap [directory]` は後方互換のAliasとして `next` と同じ結果を返す。
- [ ] Product Goal / Requirements / Constraints / Delivery / Architectureの進捗を表示する。
- [ ] Bootstrap In Progressでは、`Next Step` / `Work On` / `Goal` / `Suggested Instruction` を表示し、人間が次に触る具体的なRepository pathを確認できる。
- [ ] `Suggested Instruction` はAI Agentへ単体でコピーして意味が通るよう、対象pathを明示し、「上記ファイル」等の外部文脈依存表現を使わない。
- [ ] `Suggested Instruction` は `AGENTS.md` と関連Workflowへの入口、現在のObjective、Work Scope、Stop Conditionに限定し、Workflow本文を重複しない。
- [ ] Product Definition / Delivery Framing / Architecture Preparation / Architecture Gate / Bootstrap Finalization / Ongoing DevelopmentをRepository状態から段階的に案内し、完了済み項目を次のWork Scopeへ含めない。
- [ ] Proposed ADRがArchitecture Gate待ちなら、対象ADRをHuman Gateとして表示する。
- [ ] Human Gateでは、Decisionの判断材料となる主要なRepository SSOTを `Review Inputs` として表示する。
- [ ] Human Gateでは、承認対象となるADRのRepository pathを `Decision` として表示し、`Suggested Instruction` より人間の判断を優先する。
- [ ] Approvalはfile-orientedではなくdecision-orientedに扱い、Product / Delivery文書自体へ承認状態を追加しない。
- [ ] Human Gateの承認・却下をCLI自身は実行しない。
- [ ] 専用の承認ログをCLIやTemplateへ追加しない。監査等で必要な場合のみProject固有要件として導入する。
- [ ] 同じRepository状態から同じ判定と固定メッセージを返し、AI APIを利用しない。
- [ ] 短い英語ラベルと日本語説明を組み合わせる。

**Out of Scope**

- Repositoryの自動更新
- ADRの自動承認・却下
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
