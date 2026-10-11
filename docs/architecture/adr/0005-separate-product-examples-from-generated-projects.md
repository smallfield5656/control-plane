# ADR-0005: 製品の完成例を生成Projectから分離する

- Status: Accepted
- Date: 2026-10-11
- Supersedes: ADR-0004の完成例配置に関するDecision

## Context

ADR-0004では、File Organizer完成例の本文を `template/examples/` に集約し、`control-plane init` の生成物へ含めることを決めた。生成先のValidationも完成例を必須assetとして扱っている。

完成例はProduct Goal、Requirements、Constraints、ADR、Architectureの関係を示すControl Plane製品側の参照資料であり、利用者のProject contractではない。生成ProjectのREADME、AGENTS、Bootstrap Workflowから完成例を参照する明示的な導線はなく、Windows / Tauriという具体的な文脈が対象Projectの判断と混同される可能性がある。

`.gitignore` だけで完成例を除外すると、clone後に必須assetが欠落してValidationが失敗する。配布対象とGit管理対象を一致させたまま、製品資料と生成Projectの境界を明確にする必要がある。

## Decision

- File Organizer完成例の唯一の正本をroot `examples/file-organizer/` に置く。
- Control Plane製品のREADMEから完成例へ案内する。
- `template/` に製品固有の完成例を含めず、`control-plane init` の生成物へ配布しない。
- 生成先の `scripts/check.*` は完成例を必須assetとして検証しない。
- product repositoryの `scripts/check.*` はroot `examples/` の構造を引き続き検証する。
- packed artifactのIntegration testで、生成先に `examples/` が存在しないことを検証する。

ADR-0004のGit indexを用いたTemplate staging、credential path guard、`.gitignore` transport、generated staging copyをGit追跡しないDecisionは維持する。

## Consequences

### Positive

- 生成Projectには、そのProjectで維持すべきcontractだけが配置される。
- 製品固有のTechnology Decisionを対象Projectの文脈と誤認するRiskを減らせる。
- 完成例はControl Plane製品の資料として単一の正本を維持できる。
- 生成物の不要ファイルを`.gitignore`で隠さず、配布境界そのもので制御できる。

### Trade-offs

- 生成Project内では完成例をOffline参照できない。
- 完成例を参照するにはControl Plane製品Repositoryまたは公開Repositoryへの導線を使う。
- 公開済みCLIから生成済みのProjectは自動更新されず、既存の `examples/` は自動削除されない。

## Alternatives Considered

- **生成Projectへ配布したままGit管理する:** Project固有でないファイルが永続的に残り、文脈を混同するRiskがあるため採用しない。
- **生成Projectの `.gitignore` へ追加する:** clone後の再現性とValidation contractが崩れるため採用しない。
- **生成Projectへ配布するがValidation必須から外す:** 不要な配布と文脈混同の問題が残るため採用しない。

## Validation

- packed artifactから `init` したProjectに `examples/` が存在しない。
- root `examples/file-organizer/` の必須fileとADR headingをproduct validationで確認する。
- 生成ProjectのShell / PowerShell validationが完成例なしで成功する。
- LocalとWindows / Linux CIで `scripts/check.*` を実行する。
