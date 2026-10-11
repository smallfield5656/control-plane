---
name: tdd
description: observable behavior の追加・変更、または再現可能なbug修正を行うときに使う。
---

# TDD

テスト方針の Source of Truth は `docs/testing/strategy.md`。

## Workflow

1. Requirement / Acceptance Criteria を確認する。
2. 期待する振る舞いをtestで表現する。
3. **RED**: 期待した理由で失敗することを確認する。
4. **GREEN**: 最小限のproduction changeで通す。
5. **REFACTOR**: testをgreenのまま改善する。
6. 関連testを実行する。
7. `scripts/check.*` で全体検証する。

実装してから都合のよいtestを書く方式をTDDとは扱わない。
