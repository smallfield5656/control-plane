# ADR-0008: CLIの共通候補取得をBashとPowerShellのTab補完へ接続する

- Status: Accepted
- Date: 2026-10-11
- Supersedes: —

## Context

REQ-013では、BashとPowerShellの実際の補完機構から、実装済みコマンド・有効なオプション・Project固有item ID・ADR番号を提示する。shellごとに対象とオプションを固定するとCLIやProject definitionとずれる。

自由入力、引用符、空白path、Project外での操作を扱い、候補取得が承認や復旧を実行しないことを保証する必要がある。要求の正本は `docs/product/requirements.md`。承認と番号解決の共用設計はADR-0007を参照する。

## Decision

### 入口と候補取得

`control-plane completion bash` / `control-plane completion powershell` はpackageに含まれるshell scriptをstdoutへ出力する。生成scriptの表示にANSI色や通常の診断を混ぜない。profileを自動編集しない。

両scriptは内部入口 `control-plane completion candidates --shell <bash|powershell> --index <word-index> -- <tokens...>` を引数arrayで呼ぶ。indexはコマンド名を含むtoken arrayの0起算の補完位置。空tokenも保持し、shellのcursor位置より後の入力を補完対象に混ぜない。

CLIのコマンド・引数・オプション定義を共通registryへ集約し、通常の引数検証・help・静的候補取得で使う。registryは構文を保持し、WorkflowやProjectのitem/input/dependencyの知識は保持しない。既存のhelpとglobal no-color / version contractを維持する。

動的候補はstateのIDと、共通ADR番号resolverから取得する。Statusや承認状態で候補を隠さない。番号重複・不正path等を除外し、タイトルは説明に限って使う。

候補取得のresponseは次の二形式とする。

| shell | protocol |
| --- | --- |
| Bash | 先頭行に `values` または `directory`。以降は1行1候補の挿入値 |
| PowerShell | `{ "kind": "values" または "directory", "candidates": [{ "value": "...", "description": "..." }] }` のJSON |

挿入値は検証済みcommand / option / item ID / 4桁番号に限る。説明の制御文字は除去し、候補をshell codeとして評価しない。directoryの場合はCLIがfile一覧を出さず、adapterがshell標準のdirectory補完を呼ぶ。候補なしはvaluesの空一覧とする。

不正なtoken / index、Project外、state欠落・不正、未完了transactionでは通常エラー・stack traceをstderrへ出さず、動的候補を空にする。静的候補は残す。prefixのフィルタと入力位置の判断をCLIで共用する。理由本文など自由入力位置には候補を出さない。

candidate取得はread-onlyとし、approve / reject / check / migrate / recoverのdispatchを一切呼ばない。state v1 / v2の読取とADR解決の共通処理を使い、ネットワークやAI APIを利用しない。

### shellとの接続

Bashは補完関数を `complete -F` で登録し、COMP_WORDS / COMP_CWORDとcursorまでの引用状態を扱う。必要に応じてCOMP_LINE / COMP_POINTから未完のquoted tokenを補正し、evalで入力文を解析しない。directory候補はcompgen等の標準機構へ委譲し、空白を含むpathを配列として扱う。

PowerShellは `Register-ArgumentCompleter -Native` で登録し、CommandAst・wordToComplete・cursorPositionからtokenを取り出す。JSONをdataとして解析し、番号・item IDはその値だけをCompletionTextへ挿入し、説明をToolTipへ渡す。directory候補では空白pathを正しくquoteする。

初期の対応範囲はBash 4以上、PowerShell 7.2以上を提案する。確認環境はLinux / WSLのBashとWindowsのPowerShell 7とし、実補完機構のtestで検証する。古いWindows PowerShell 5.1、Zsh、Fishの対応は今回含めない。対応するversionを拡大・縮小する必要があれば、受入条件と公開前の互換性レビューで明示する。

有効化と解除、継続利用する設定の追記方法をCLI READMEへ記載し、root READMEから参照する。セッションの設定だけで利用できる手順を最初に置く。shell assetはpackageの配布一覧に含め、source treeへのfallbackは持たない。

## Consequences

### Positive

- 両shellの候補取得元が揃い、新Templateと既存・独自ProjectのIDを扱える。
- CLIの構文変更と補完候補が同じregistryを使い、shellには知識を重複させない。
- offline・read-onlyで、Project外でもコマンド補完を利用できる。

### Negative / Trade-offs

- token解析・引用・directory補完はshell固有で、実機を通したtestが必要になる。
- Tab操作ごとにNode.jsプロセスを起動する。常駐serviceやcache invalidationを初期実装へ追加せず、実際の反応時間に問題があれば計測して判断する。
- 初期対象のshell versionを明示し、その他への動作保証は行わない。

## Alternatives Considered

### 各shellへコマンド・対象IDを固定で列挙する

stateとCLIの構文からdriftするため採用しない。

### 外部補完frameworkまたは常駐processを導入する

実行時依存・配布・保守の負担を増やす。現在のScopeでは標準shell機構と既存CLIで成立させる。

## Validation

実装前のREDから、共通候補と実shellの両方を確認する。

- command / option / item / ADR / directoryの入力位置、prefix、候補1件・複数・なし。
- product-overview / product-goal / Project固有ID、0000・template・README・番号重複の除外、タイトルを引数へ入れないこと。
- 空白path、引用途中の入力、cursor位置、自由入力、不正state・Project外で静的候補を維持すること。
- Bashの登録した補完関数と、PowerShellのCommandCompletionを通した候補取得、解除手順。
- 補完前後のRepository bytes・shell設定に変更がなく、承認・検証・復旧が実行されないこと。
- packed artifactをインストールした環境に必要assetが揃うこと、Windows / Linux CI、`scripts/check.*`。
