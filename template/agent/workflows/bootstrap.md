# Bootstrap Workflow

新しいプロジェクトを始めるときは、技術スタックを先に決めない。

## 1. Product Goal

`docs/product/overview.md` を作成し、Problem / Users / Goals / Non-Goals / Success Criteria を定義する。

## 2. Requirements

`docs/product/requirements.md` に主要 Requirement と Acceptance Criteria を定義する。

## 3. Constraints

`docs/product/constraints.md` に platform、distribution、security、network、data、operations、team、cost、project stage を整理する。

Constraint は技術選定より前に存在する外部条件・事業条件・運用条件を記録する。Python、Node.js、Tauri など、比較の結果として採用するTechnologyをConstraintへ先回りして書かない。

## 4. Delivery Framing

`docs/delivery/` に、プロジェクト規模に応じて次を整理する。

- `charter.md`: Scope / Stakeholders / Budget Guardrail / Success Metrics
- `estimate.md`: Effort / Cost / Assumptions / Confidence
- `risks.md`: 主要Risk / Mitigation / Owner
- `milestones.md`: Outcomes / Decision Gates / Target

小規模な実験では内容を最小限にしてよい。過剰なプロセスを導入しない。

見積もりはまず person-hours / person-days 等の Effort range と Confidence を示す。単価が与えられている場合のみCostへ変換し、不明な単価を推測しない。

AI Agentと協働する場合、`estimate.md` では次を分けて示す。

- **AI Agent Elapsed**: AI Agentが分析・生成・検証等に要する経過時間。Human laborではない。
- **Human Involvement**: 壁打ち、判断、レビュー、承認、修正指示など、人間が実際に関与する時間。
- **Human-only Equivalent**: 同じScopeと品質条件をAI Agentなしで人間だけが実施した場合の推定工数。

`AI Agent Elapsed` と `Human Involvement` は性質が異なるため総工数として単純合算しない。Human-only Equivalentが実測でない場合は比較用の反実仮想Estimateとして扱い、AssumptionsとConfidenceを明示する。AI-assisted / Human-onlyを比較するときはScopeと品質条件を揃える。

## 5. Quality Attributes

特に重要な品質特性を明確にする。

例:
- Performance
- Reliability
- Security
- Maintainability
- Portability
- Operability
- Testability

## 6. Architecture Candidates

要求と制約から、適切な architecture style を候補化する。

## 7. Technology Candidates

候補技術は次の観点で比較する。

- 要求適合性
- 制約適合性
- 保守性
- 成熟度
- 運用負荷
- ecosystem
- test / lint / type / schema などの自動検証能力
- team familiarity
- lock-in
- cost

必要な場合のみDecision Matrixを使う。

## 8. Spike

不確実性が高く、議論だけでは判断できない項目は小さな Spike で検証する。

Spike には仮説、成功条件、測定値、結論を残す。

## 9. Decision / Architecture Gate

長期的な影響がある技術選定は ADR に記録する。

人間の承認が必要な判断は、承認前はADRを `Proposed` とする。人間がCLIで判断を記録する。コマンド・Status遷移・却下理由・置き換えの形式は `docs/architecture/adr/README.md` を正本とする。

Bootstrap完了後にAccepted Decisionを変更する場合も、過去のADRを書き換えず新しいADRでSupersedeする。通常開発時の詳細なDecision変更フローは `agent/workflows/issue.md` を正本とする。

Approvalは表示項目またはDecision Gate単位で扱う。`docs/product/` や `docs/delivery/` は判断材料となるSSOTであり、各ファイル本文へ承認metadataを持たせない。Human Gateでは、Review Inputsを確認したうえでADRなどのDecisionを判断する。

現在の承認状態は `.control-plane/bootstrap-state.json` を正本とする。これはApproval historyではなくCurrent Stateであり、必要な変更履歴はADRのStatusとGit / Pull Requestの履歴へ委ねる。ただし監査・法令・契約などで本人性を含む承認記録が必要な場合は、Project固有の要件として署名やPR approvalを追加する。

人間は項目を確認してCLIで明示承認する。人間がAIへ対象を特定した承認を指示した場合も、`.agents/skills/project-bootstrap/SKILL.md` に従い同じCLIを使う。無言、会話終了、Agent自身の品質判断を承認と解釈しない。承認後に対象または上流inputが変わった場合は `Needs Review` とし、再承認まで次Stepへ進まない。

Budget / Risk / Timelineへの重大な影響がある場合も、必要なDecision Gateを通す。

人間承認が必要なADRを提示できる状態まで整理できたら、そこで **Bootstrap Preparation Complete / Architecture Gate Pending** と報告し、Scaffoldや実装を開始せず承認を待つ。

## 10. Current Architecture

ADR採用後、AIが現在状態を `ARCHITECTURE.md` に反映する。人間が反映結果を確認し、stateに定義されたArchitecture項目をCLIで承認する。ADRの採用と設計全体の反映確認を分ける。

## 11. Scaffold

Architecture Gateが必要な場合は承認後にプロジェクトを生成する。

Scaffold時は `docs/testing/strategy.md` を参照し、採用Technologyの慣習と合わせてTest placementを決める。Repository横断のE2Eを無理由にroot直下へ増やさず、原則 `tests/e2e/` を使う。

`scripts/check.*` はControl Plane共通の検証入口とする。採用技術固有の test / lint / typecheck / build 等は、必要なPlatformに応じて `scripts/check-project.sh` または `scripts/check-project.ps1` に置き、共通checkから呼び出す。

両Platform用hookを形式的に揃える必要はない。実際に利用・検証するPlatformだけを用意する。

CIを導入する場合、runtime / dependency setupは採用Technologyに合わせてProject固有に構成するが、最終的な検証入口はLocalと同じ `scripts/check.*` を使う。CI内へtest / lint / buildの知識を重複させない。

## 12. Project README

Bootstrap後は、ルート `README.md` をテンプレート説明ではなく、そのプロジェクト固有の入口へ置き換える。

最低限、Purpose、Setup / Run、Validation、主要Documentationへの導線を示す。Control Plane固有の詳細は `AGENTS.md` と関連Workflowを正本として参照し、READMEへ重複させない。

## Bootstrap Preparation Gate

Architecture Gate待ちとして停止する前に次を確認する。

- Product Goalが定義されている
- 主要Requirements / Acceptance Criteriaが定義されている
- ConstraintsがTechnology Decisionと分離されている
- Scope / Effort Estimate /主要Risks / Milestonesが必要な粒度で整理されている
- AI協働Projectでは、AI Agent Elapsed / Human Involvement / Human-only Equivalentが区別されている
- 主要なArchitecture / Technology候補と推奨理由を説明できる
- 人間承認が必要な判断がADR `Proposed` として記録されている
- 未承認Technologyを `ARCHITECTURE.md` の現在状態として既成事実化していない

この状態は **Bootstrap Preparation Complete** であり、Bootstrap完了ではない。

## Bootstrap Completion Gate

Bootstrap完了と報告する前に次を確認する。

- Product Goalが定義されている
- 主要Requirements / Acceptance Criteriaが定義されている
- ConstraintsがTechnology Decisionと分離されている
- Scope / Effort Estimate /主要Risks / Milestonesが必要な粒度で整理されている
- AI協働Projectでは、AI Agent Elapsed / Human Involvement / Human-only Equivalentが区別されている
- 主要なArchitecture / Technology decisionが説明できる
- 人間承認が必要なADRはArchitecture Gateを通過し、状態が反映されている
- Bootstrap Current Stateの全項目が現在revisionに対して明示的に承認されている
- `ARCHITECTURE.md` が現在状態を表している
- ルート `README.md` がプロジェクト固有の入口になっている
- 採用技術固有の検証が必要なら project validation hook が用意されている
- Bootstrap文書に必須の `TODO:` が残っていない
- `scripts/check.*` が成功する
