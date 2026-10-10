# Architecture

## Overview

Windows 11向けのLocal-first Desktop app。UIはWeb技術、Desktop runtimeはTauriを利用する。

## Technology Stack

- Frontend: TypeScript + Web UI framework
- Desktop runtime: Tauri
- Persistence: 必要になるまで導入しない
- Testing: Unit test + filesystem境界のIntegration test

## Structure

```text
UI
 ↓
Application logic
 ↓
Filesystem adapter
 ↓
Local filesystem
```

## Boundaries

- UIから直接Filesystem APIを呼ばない。
- File moveの判断と実際のI/Oを分離する。
- PreviewとExecutionで同じ分類ロジックを利用する。

## Current Decisions

Tauri採用理由は `adr-0001-use-tauri.md` を参照する。
