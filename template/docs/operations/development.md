# Development

## Bootstrap

新しいプロジェクトでは、まず `agent/workflows/bootstrap.md` に従う。

## Work Intake

開発作業はGitHub IssueなどのWork Itemから開始できる。

ただし、外部Work ItemはSource of Truthではない。

- GitHub Issue: 変更要求、Bug、調査依頼などのWork Intake
- Issue comments: 議論、補足情報、仮説
- Repository documentation: 合意された永続的な知識
- Tests: 期待される振る舞いのExecutable Specification
- Pull Request: Repositoryへの変更提案
- Git history: 変更履歴

永続的に有効な情報がIssue内で合意された場合は、Issueを参照し続けるのではなく対応するSSOTへ反映する。

詳細は `agent/workflows/issue.md` を参照する。

## Daily Development

1. Requirement / Acceptance Criteria を確認する。
2. 必要な正本だけを読む。
3. Cost / Risk / Timelineへの影響があるか確認する。
4. TDDが適用される変更では RED を確認する。
5. 最小の実装で GREEN にする。
6. REFACTOR する。
7. 関連テストを実行する。
8. `scripts/check.ps1` または `scripts/check.sh` を実行する。
9. 正本が変わった場合だけ documentation を更新する。

## Review

Reviewでは、細かな好みより先に変更の正しさと長期保守性を確認する。

優先して確認する項目:

1. Requirement / Acceptance Criteriaを満たしているか。
2. Design / Architectureが妥当で、既存の境界を不必要に崩していないか。
3. Scopeに対して不要なComplexityや抽象化を追加していないか。
4. Testsが重要なBehaviorとRegression riskを適切なlevelで検証しているか。
5. Security / Data / Operations / Deliveryへの影響が見落とされていないか。
6. Durable truthが変わった場合、対応するSSOTだけが更新されているか。

Blocking issueとNitを区別する。完璧さを要求するために小さな改善を止めず、変更後にcodebase全体の健全性が維持または改善されることを重視する。

変更は可能な限り小さく、独立してレビュー可能な単位に保つ。

## Security Review Triggers

すべての変更にSecurity processを要求しない。次のような要素を新規導入・変更する場合は、実装前にSecurity impactを明示し、必要ならDecision Gateを設ける。

- Authentication / Authorization
- PII / sensitive data
- Secrets / credentials
- External network access
- File upload / untrusted input
- Command execution
- Payment
- Cryptography
- Public API
- Security / Compliance上重要なdata persistence

Low-riskなlocal toolなど、Security exposureが実質的に増えない変更では追加文書を形式的に作らない。

## Decision Gate

次のような重大影響がある場合は、実装前に人間の判断を求める。

- Scopeの大幅変更
- Estimate / Budget Guardrailへの重大影響
- High impact Riskの追加
- Milestone / Release時期の重大変更
- Security / Complianceへの重大影響
- 長期的なArchitecture変更

すべての変更にGateを要求しない。プロジェクト規模と変更Riskに応じて適用する。

## Validation Entry Point

プロジェクト全体の検証入口は `scripts/check.*` に集約する。

AI agent に複数の個別コマンドを覚えさせるのではなく、1つの安定した入口を提供する。

Technology固有の test / lint / typecheck / build / E2E や、その実行に必要なpreflightは `scripts/check-project.*` 側の責務とする。Control Plane共通checkへPlaywrightなど特定Technologyの知識を持ち込まない。

## CI

CIでもLocalと同じValidation Entry Pointを使う。

```text
Local ─┐
       ├─> scripts/check.*
CI ────┘
```

Runtime、dependency、browser、OS package等のsetupはProject固有で構成する。CI workflowへtest / lint / buildの実行知識を重複させず、setup後の最終検証は `scripts/check.*` に委譲する。

## Repository Hygiene / Public Data

Gitで追跡するのはSource、合意されたDocumentation、公開用の設定・Sample。Build output、packagingのstaging copy、ログ、Test report、実Credential、非公開の業務Dataは公開しない。

- `.env.example` や共有設定を置く場合、実Secretを含めず、必要なら環境変数の参照だけを記載する。
- `.npmrc` と証明書は既定で除外する。Secretを含まない共有設定・公開証明書が必要な場合だけ、対象fileをReviewして明示的に管理する。
- 外部Issue、添付画像、DB dump、AI session履歴は、個人情報・顧客情報・内部情報を確認してから扱う。
- `.gitignore` は既に追跡されたfileやGit履歴を消さない。漏えいしたCredentialは先に失効・再発行し、必要なら履歴の除去を別作業として検討する。
- CommitのAuthor / Committer emailも公開される。個人emailを公開しない場合はGitHubの `noreply` をローカルGitに設定する。
- Public repositoryではGitHub Secret scanning / Push protectionの有効化状況を確認する。file名の除外やReviewだけをSecret検出の保証にしない。
