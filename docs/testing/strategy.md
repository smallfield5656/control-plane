# Testing Strategy

## Philosophy

テストは実装詳細ではなく、外部から観測できる振る舞いを検証する。

振る舞いの変更では原則として **RED → GREEN → REFACTOR** を使う。

## When TDD Applies

- Behavior change: TDD
- Bug fix: regression test first
- Refactoring: 既存テストを green のまま維持
- Documentation-only: 新しい behavioral test は不要
- Build / tooling change: 変更内容に適した自動検証を行う

## Test Levels

### Unit

純粋なロジック、validation、business rule を高速に検証する。実装コードの近くに配置してよい。

### Integration

DB、filesystem、repository、複数component間の結合を検証する。

### Contract

API、schema、外部interfaceの互換性を検証する。

### E2E

重要なユーザーフローに限定する。

## Regression Tests

再現可能なバグには、原則として修正前に regression test を追加する。

## Avoid

- private implementation detail の固定
- framework内部挙動の再テスト
- 意味のない trivial test
- 外部契約でない内部call順序の固定
