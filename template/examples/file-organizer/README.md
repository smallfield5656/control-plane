# File Organizer Example

このExampleは、Windows向けの簡単なファイル整理ツールを題材に、Product Goal → Requirements → Constraints → ADR → Architecture のつながりを示します。

このExample自体を実装する必要はありません。各SSOTの粒度と責務を理解するための参照用です。

## Scenario

ユーザーが指定したフォルダ内のファイルを拡張子ごとに分類し、サブフォルダへ移動できるDesktop appを作る。

## Files

- `overview.md`: 何を解決するか。
- `requirements.md`: 何ができる必要があるか。
- `constraints.md`: 何を満たさなければならないか。
- `adr-0001-use-tauri.md`: なぜTauriを採用したか。
- `ARCHITECTURE.md`: 現在の構成がどうなっているか。

ポイントは、同じ事実を複数ファイルに重複して書かないことです。
