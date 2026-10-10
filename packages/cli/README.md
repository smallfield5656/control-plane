# control-plane

AI-assisted software projects向けのEngineering Control Plane CLIです。

## Quick Start

```bash
npx control-plane init my-app
cd my-app
npx control-plane doctor .
npx control-plane check .
```

`init` はControl Plane Templateを新規Directoryへ展開します。既存Directoryは上書きしません。

## Commands

```text
control-plane init <directory>
control-plane doctor [directory]
control-plane check [directory]
control-plane --help
control-plane --version
```

Template / Workflow / Validation contractがDurable Truthであり、CLIはそれらを操作する薄いInterfaceです。
