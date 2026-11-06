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
```

## Adding New Parsers

1. Create a new parser class extending `BaseParser`
2. Implement `canParse()`, `parse()`, and `getPriority()` methods
3. Add the parser to `ParserFactory`
4. Add tests for the new parser
