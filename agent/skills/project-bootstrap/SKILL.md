---
name: project-bootstrap
description: 新しいプロジェクトで、要求・制約・品質特性から技術スタックと初期アーキテクチャを決めるときに使う。
---

# Project Bootstrap

`agent/workflows/bootstrap.md` を実行するためのSkill。

## Rules

- 技術スタックを要求より先に決めない。
- 好みより Constraints を優先する。
- 候補が拮抗する場合は比較表を作る。
- 不確実性が高い場合は Spike する。
- 重要な決定は ADR に残す。
- PoC最適と Production最適を混同しない。
- 最終的な現在状態は `ARCHITECTURE.md` に反映する。
