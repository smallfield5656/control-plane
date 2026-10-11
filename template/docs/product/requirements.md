# Requirements

このファイルは、プロダクト要求と Acceptance Criteria の Source of Truth です。

`requirements.md` は履歴台帳ではなく、**現在有効な要求を表すCurrent Truth** として更新する。仕様変更で要求が変わった場合は、現在有効なStatement / Acceptance Criteriaへ書き換えてよい。変更の経緯はGit / Issue / Pull Requestの履歴へ委ね、`requirements-v2.md` のような版別ファイルを通常運用として増やさない。

Requirement IDは、Test / Issue / Pull Requestから安定して参照できるよう、意味が継続している限り可能な範囲で維持する。要求の意味が別物になる場合や、旧要求を明示的に廃止・置換する必要がある場合は、既存IDを無理に再利用せず、新しいRequirementとして追加する。

実装方式や長期的なArchitecture Decisionはここへ埋め込まず、必要ならArchitecture / ADRへ分離する。

## Requirement Template

### REQ-001: <短い名称>

**Statement**

<ユーザーまたはシステムが実現すべき振る舞い>

**Acceptance Criteria**

- [ ] ...
- [ ] ...

**Out of Scope**

- ...

**Notes**

補足のみを書く。実装方式はここで決めず、必要なら Architecture / ADR へ分離する。

## Requirements

<!-- プロジェクト固有の要求をここに追加する -->
