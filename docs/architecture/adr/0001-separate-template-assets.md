# ADR-0001: Separate generated project template assets from the control-plane product repository

- Status: Accepted
- Date: 2026-10-10
- Supersedes: —

## Context

Repository rootにはcontrol-plane自身のProduct資産と、生成先Project向け資産が同居していた。CLI `init` が安全にTemplateを展開するには、生成Sourceを明確にする必要がある。

## Decision

生成先Project用assetの正本を `template/` 配下へ分離する。

Repository rootはcontrol-plane自身のProduct repositoryとして扱う。rootに残る同名のWorkflow / Documentation / GitHub設定はcontrol-plane自身の運用資産であり、`control-plane init` の生成Sourceにはしない。

`control-plane init` は `template/` のみを読み、Template本文をCLIへhard-codeしない。

Migration初期は既存利用者への破壊的変更を避けるため、root資産を一括削除せず責務を切り替える。将来、重複が保守上の問題になった場合に別Decisionとして整理する。

## Consequences

### Positive

- CLIの生成対象が一意になる。
- control-plane自身のProduct docsと生成Templateを分離できる。
- CLIとTemplateを同一Repositoryで同期できる。
- 将来のupdate/versioningの基盤になる。

### Negative / Trade-offs

- 一部の汎用Workflowはrootとtemplateに同形の資産を持つため、変更時に同期確認が必要になる。
- 旧来の「Repository rootをそのままTemplateとしてcloneする」使い方からCLI中心の導線へ移行する必要がある。

## Alternatives Considered

### RootをTemplateのまま維持

Migrationは小さいが、Product repositoryとTemplateの境界が曖昧なままになるため不採用。

### CLIを別Repositoryへ分離

現段階ではversion driftと同期コストが大きいため不採用。

## Validation

- `template/` に生成に必要なSSOT / Workflow / Validation / Exampleが存在すること。
- CLIのintegration testで生成Projectの主要contractを確認すること。
- `template/scripts/check.*` がTemplate rootで成功すること。
