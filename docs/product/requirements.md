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

初期CLIは主要Desktop development environmentで利用できる設計とする。

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

初期CLIは `init / doctor / check` に限定し、必要性が未実証の機能を追加しない。

**Acceptance Criteria**

- [ ] `bootstrap / status / update / report / estimate` は初期MVPのOut of Scopeとする。
- [ ] `control-plane.yml`、Project Profile、Plugin system、Subagentsは初期MVPの必須要素にしない。
