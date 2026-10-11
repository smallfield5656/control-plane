# ADR-NNNN: Title

- Status: Proposed
- Date: YYYY-MM-DD
- Supersedes: —
- Superseded By: —

## Context

何を決める必要があるのか。前提・制約・問題を記述する。

ConstraintとTechnology Decisionを混同しない。ここには、Requirements / Constraintsを踏まえて比較・判断する対象を書く。

## Decision

採用する判断を明確に書く。

人間の判断記録とADRの操作は `docs/architecture/adr/README.md` に従う。

AcceptedになったADRはDecision historyである。後からArchitecture / Technology Decisionを変更する場合、既存のAccepted ADRのDecision本文を新しい判断に合わせて書き換えない。

Decisionを置き換える場合は、新しいADRを `Proposed` として作成し、`Supersedes` に旧ADRを記載する。新ADRがAcceptedになったら旧ADRを `Superseded` にする。新ADRがRejectedの場合、旧ADRは引き続き有効とする。

ADRは「なぜそのDecisionをしたか」というDecision historyを残し、`ARCHITECTURE.md` は「今なにが有効か」というcurrent stateを表す。

## Consequences

### Positive

- ...

### Negative / Trade-offs

- ...

## Alternatives Considered

### Option A

- 利点:
- 欠点:

### Option B

- 利点:
- 欠点:

## Validation

必要なら、この判断を検証した Spike / benchmark / test の結果を記録する。
