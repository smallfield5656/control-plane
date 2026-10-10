# ADR-0001: Use Tauri for the desktop runtime

- Status: Accepted

## Context

このApplicationはWindows 11向けDesktop appとして配布し、利用者にNode.jsやPythonを要求せず、通常利用をローカルで完結させる必要がある。

UIはWeb技術で実装したい一方、ファイルシステム操作を安全に扱い、配布物のサイズとRuntime overheadを抑えたい。

## Decision

Desktop runtimeとしてTauriを採用する。

FrontendはTypeScriptベースのWeb UIとし、OS側の処理はTauri経由で行う。

## Consequences

### Positive

- Web UI ecosystemを利用できる。
- Electronより小さい配布物を期待できる。
- Native filesystem APIへ明示的な境界を設けやすい。

### Negative

- Rust/Tauri固有の知識が必要になる。
- Web onlyの構成よりBuild pipelineが複雑になる。

## Alternatives Considered

- Electron: ecosystemは成熟しているが、今回の規模ではRuntime overheadを許容する理由が弱い。
- Python GUI: PoCには適するが、配布・型安全性・Frontend開発体験の観点で今回のProduction要件には優先しない。
