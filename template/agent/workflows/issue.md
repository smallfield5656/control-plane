# Issue Workflow

GitHub Issueなどの外部Work Itemから作業を開始するときの標準Workflow。

Issue自体をSource of Truthとして扱わない。Issueは変更要求、問題報告、調査依頼などのWork Intakeである。

## 1. Intake

Issueを次のいずれかに分類する。

- Feature
- Bug
- Investigation
- Tech Debt
- Documentation
- Architecture

## 2. Context

Issueの記述だけで判断せず、関連するRepository上のSSOTを読む。

- Feature: `docs/product/` と必要な `docs/delivery/`
- Bug: 関連Requirement / Tests / Implementation
- Architecture: `ARCHITECTURE.md` と既存ADR
- Investigation: 判断対象のRequirement / Constraint / Architecture / Delivery情報

## 3. Clarify

不足情報が結果に重大な影響を与える場合のみ確認する。

RequirementやConstraintを推測で変更してはならない。

## 4. Impact Analysis

最低限、次への影響を判定する。

- Requirements
- Constraints
- Architecture
- Cost / Estimate
- Risks
- Timeline / Milestones
- Security
- Operations
- External contracts

すべての仕様変更でADRを作る必要はない。RequirementやUI behaviorだけが変わり、既存Architecture Decisionを維持できる場合は、対応するSSOT / Test / Implementationを更新する。

一方、Accepted ADRで確定した長期的なArchitecture / Technology Decisionを変更する必要がある場合は、Architecture impactとして扱う。

Cost / Risk / Timeline / Security / Architectureへの重大な影響がある場合は、実装前に人間の判断を求める。

Security impactがある場合は `docs/operations/development.md` のSecurity Review Triggersを確認する。

## 5. Promote Durable Knowledge

IssueやIssueコメントで合意した会話や合意履歴そのものをRepositoryへ複製しない。将来も有効な結果だけを対応するSSOTへ反映する。

- Feature requirement → `docs/product/requirements.md`
- New constraint → `docs/product/constraints.md`
- Scope / stakeholder / budget guardrail → `docs/delivery/charter.md`
- Cost / effort assumption → `docs/delivery/estimate.md`
- Project risk → `docs/delivery/risks.md`
- Schedule / Decision Gate → `docs/delivery/milestones.md`
- Architecture decision → ADR
- Current architecture → `ARCHITECTURE.md`

### Current Truth / Decision History / Change History

Repository上の情報は役割を分けて扱う。

- `requirements.md` / `constraints.md` / Delivery文書 / `ARCHITECTURE.md` は、原則として**現在有効な状態を表すCurrent Truth**。変更要求が採用されたら、現在有効な内容へ更新する。
- ADRは**Decision History**。Accepted済みの過去Decisionを現在仕様に合わせて書き換えず、Decision変更は新ADRで表す。
- Issue / Pull Request / Git historyは**Change History**。変更要求、議論、差分、いつ何が変わったかを追跡する。

Current state documents are updated. Decision records are superseded. Git preserves history.

Current Truthの過去版を残す目的だけで `requirements-v2.md` や `ARCHITECTURE-old.md` のような版別ファイルを通常運用として増やさない。過去差分が必要な場合はGit / Pull Requestを参照する。

Issueコメントを永続仕様として参照し続けない。合意の経緯を別のmeeting noteやapproval logへ形式的に複製しない。判断理由を将来残す必要がある場合はADRなど、その情報のSSOTへ必要なContext / Decision / Consequencesだけを記録する。

重大なDecisionを伴う場合は、Durable Truthを更新し、必要なHuman Gateを通してから実装へ進む。小さなBug Fixや軽微変更では、文書変更と実装を形式的に別PRへ分ける必要はない。

### Decision Change / ADR Supersession

Accepted ADRで確定したDecisionを後から変更する場合、過去の判断履歴を現在仕様に合わせて書き換えない。

- Accepted ADRのDecision本文を直接書き換えて、新しい判断として扱わない。
- 新しいDecisionを別ADRとして作成し、承認前は `Proposed` とする。
- 新ADRの `Supersedes` に置き換える旧ADRを明記する。
- 必要なHuman Gateを通し、新ADRが承認されたら `Accepted` にする。
- 新ADRがAcceptedになった時点で、置き換えられる旧ADRを `Superseded` にする。
- その後、`ARCHITECTURE.md` を新しい現在状態へ更新してから実装を進める。
- 新ADRがRejectedの場合、旧ADRは引き続き有効なDecisionとして扱う。

Requirements may evolve. Decisions may be superseded. History should not be rewritten.

ADRは「なぜそのDecisionをしたか」というDecision historyを残す。`ARCHITECTURE.md` は「今なにが有効か」というcurrent stateを表す。

## 6. Implement

Behavior change:

`RED → GREEN → REFACTOR`

Bug:

`Regression Test → RED → Fix → GREEN`

Investigation:

`Hypothesis → Spike → Evidence → Conclusion`

## 7. Validate

`scripts/check.sh` または `scripts/check.ps1` を実行する。

## 8. Pull Request

Pull Requestには最低限次を記載する。

- Related Issue
- What changed / Why
- Source of Truth updates
- Verification
- Review focus
- Architecture impact
- Security / Data impact
- Cost / Risk / Timeline impact
- Remaining work

Reviewは `docs/operations/development.md` のReview方針に従う。

## 9. Close

PRがMergeされ、必要なSSOT更新と検証が完了してからIssueをCloseする。

IssueのClose自体を仕様確定の証拠として扱わない。
