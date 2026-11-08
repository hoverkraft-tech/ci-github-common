# Developing the CI report parser

## Architecture

This action follows SOLID principles with clear separation of concerns:

```text
src/
├── models/          # Data models (ReportData, TestResult, LintIssue, Coverage)
├── parsers/         # Parser implementations (Strategy pattern)
│   ├── BaseParser.js
│   ├── JUnitParser.js
│   ├── TAPParser.js
│   ├── CoberturaParser.js
│   ├── LCOVParser.js
│   ├── ESLintParser.js
│   ├── CheckStyleParser.js
│   ├── SarifParser.js
│   └── ParserFactory.js  # Factory pattern for parser selection
├── formatters/      # Output formatters
│   ├── SummaryFormatter.js
│   └── MarkdownFormatter.js
├── ReportParserCore.js  # Core parsing logic
├── ReportPathResolver.js # Path resolution and auto-detection
└── index.js             # GitHub Actions entrypoint
```

## Running Tests

```bash
cd actions/quality/parse-ci-reports
npm ci --ignore-scripts
npm test
npm run check:dist
```

## Distribution

The action loads the committed `dist/index.js` through `github-script`; it does
not install packages or change the caller's Node version. Maintainers use Node
24 or later and `npm ci --ignore-scripts`, then `npm run build` after changing
source or dependencies. Commit the complete `dist/` directory, including its
third-party licenses. Do not edit generated files.

`npm run check:dist` rebuilds from the lockfile installation and fails if the
distribution differs from Git, including added or removed files. CI runs this
build gate before tests and exercises the action on a host and in a container.
The distribution tests copy only `dist/` to a temporary directory and compare
its outputs with source across every supported report format. CodeQL scans the
maintained source and excludes the generated copy; dependency review checks the
lockfile. The repository package commands also skip distribution metadata.

See [ADR 0001](../adr/0001-bundle-ci-report-parser.md) for the decision and evidence.

## Adding New Parsers

1. Create a new parser class extending `BaseParser`
2. Implement `canParse()`, `parse()`, and `getPriority()` methods
3. Add the parser to `ParserFactory`
4. Add tests for the new parser
