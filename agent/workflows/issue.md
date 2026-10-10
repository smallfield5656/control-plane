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

Cost / Risk / Timeline / Security / Architectureへの重大な影響がある場合は、実装前に人間の判断を求める。

## 5. Promote Durable Knowledge

IssueやIssueコメント内で合意された永続情報は対応するSSOTへ反映する。

- Feature requirement → `docs/product/requirements.md`
- New constraint → `docs/product/constraints.md`
- Scope / stakeholder / budget guardrail → `docs/delivery/charter.md`
- Cost / effort assumption → `docs/delivery/estimate.md`
- Project risk → `docs/delivery/risks.md`
- Schedule / Decision Gate → `docs/delivery/milestones.md`
- Architecture decision → ADR
- Current architecture → `ARCHITECTURE.md`

Issueコメントを永続仕様として参照し続けない。

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
- Architecture impact
- Cost / Risk / Timeline impact
- Remaining work

## 9. Close

PRがMergeされ、必要なSSOT更新と検証が完了してからIssueをCloseする。

IssueのClose自体を仕様確定の証拠として扱わない。
