# control-plane

`control-plane` は、人間が意図・制約・品質基準を定義し、AIエージェントがその境界内で安全に実装・検証・レビューするための開発テンプレートです。

## 基本思想

- **SSOT**: 同じ事実を複数箇所に重複させない。
- **Bootstrap first**: 技術ありきではなく、要求・制約・品質特性から技術を選ぶ。
- **TDD**: 振る舞いの変更では `RED → GREEN → REFACTOR` を基本とする。
- **Executable rules**: 守るべきルールは、可能な限り test / lint / CI / script にする。
- **Small instructions**: `AGENTS.md` や Skill は巨大化させず、必要な情報へのルーターとして使う。
- **Vendor neutral**: 特定のAIツール固有設定をSSOTにしない。

## 開発フロー

```text
Product idea
  ↓
Bootstrap
  ↓
Requirements / Constraints
  ↓
Architecture / Technology Decision
  ↓
ADR
  ↓
TDD
  ↓
Implementation
  ↓
Validation / Review
```

まず `AGENTS.md` と `agent/workflows/bootstrap.md` を参照してください。
