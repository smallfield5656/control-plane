# Architecture Principles

技術選定・設計で迷ったときの共通原則です。

1. **Requirements before technology** — 技術からではなく要求から始める。
2. **Constraints before preferences** — 好みより制約を優先する。
3. **Prefer boring technology** — 実績があり理解・運用しやすい技術を優先する。
4. **Prefer fewer technologies** — 技術の種類を必要以上に増やさない。
5. **Prefer executable verification** — 型、test、lint、schema validation などで誤りを検出しやすい技術を優先する。
6. **Optimize for maintainability** — cleverness より保守性を優先する。
7. **Spike uncertainty** — 議論だけで分からないことは、小さな実験で測る。
8. **Record significant decisions** — 長期的に影響する技術選定は ADR に残す。
9. **Generated artifacts are not SSOT** — 生成物を独立した正本にしない。
10. **Change technology for measurable reasons** — 流行ではなく、測定可能な理由で置き換える。
