<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stY2lyY2xlIiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjIyIDQgMTIgMTQuMDEgOSAxMS4wMSI+PC9wb2x5bGluZT48L3N2Zz4=) GitHub Action: Parse CI Reports

<!-- header:end -->
<!-- overview:start -->

## Overview

Parse CI reports (tests, linting, coverage) into GitHub summary and Markdown for PR comments.
This action parses various report formats from testing, linting, and coverage tools and generates:

- GitHub Step Summaries for workflow runs
- Markdown output suitable for pull request or issue comments
- GitHub Annotations for failed tests and linting issues

It supports multiple common report standards out of the box.

See the [formats and examples guide](../../../docs/usage/parse-ci-reports.md).

### Architecture

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

### Running Tests

```bash
cd actions/quality/parse-ci-reports
npm ci --ignore-scripts
npm test
npm run check:dist
```

### Distribution

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

Allowed dependency updates use the shared [distribution automation](../../../.github/workflows/action-distributions.md)
to commit regenerated bundles into the same PR. Human source changes still include
their rebuilt distribution.

See [ADR 0001](../../../docs/adr/0001-bundle-ci-report-parser.md) for the decision and evidence.

### Adding New Parsers

1. Create a new parser class extending `BaseParser`
2. Implement `canParse()`, `parse()`, and `getPriority()` methods
3. Add the parser to `ParserFactory`
4. Add tests for the new parser

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@3370e0d18bdfeeaff1ffb8151f46332d935dab0f # perf/475-p2-report-parser-bundle
  with:
    # Paths to report files (glob patterns supported, one per line or comma-separated).
    # Each explicit path or glob must match a file after exclusions; missing reports fail the action.
    # Auto-detection may match no files. Exclusion patterns do not require a match.
    # Set to `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all` for automatic detection.
    # Examples: `**/junit.xml`, `coverage/lcov.info`, `eslint-report.json`, `reports/results.sarif`, `auto:all`, `auto:test,coverage/lcov.info`, `auto:test,auto:coverage`
    #
    # Default: `auto:all`
    report-paths: auto:all

    # Name to display in the summary (e.g., `Test Results`, `Coverage Report`).
    #
    # Default: `Report Summary`
    report-name: Report Summary

    # Whether to include passed tests in the summary.
    #
    # Default: `false`
    include-passed: "false"

    # Output format: comma-separated list of `summary`, `markdown`, `annotations`, or `all` for everything.
    #
    # Default: `all`
    output-format: all

    # Whether to fail the action if any test failures are detected.
    #
    # Default: `false`
    fail-on-error: "false"

    # Path mapping(s) to rewrite file paths in reports (format: "from_path:to_path").
    # Useful when tests/lints run in a different directory or container.
    # Multiple mappings can be provided separated by newlines or commas.
    # Examples:
    # - Single mapping: "/app/src:./src"
    # - Multiple mappings: "/app/src:./src,/app/tests:./tests"
    # - Multi-line: |
    # /app/src:./src
    # /app/tests:./tests
    path-mapping: ""

    # Working directory where the action should operate.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                                      | **Required** | **Default**      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- |
| **`report-paths`**      | Paths to report files (glob patterns supported, one per line or comma-separated).                                                                                    | **false**    | `auto:all`       |
|                         | Each explicit path or glob must match a file after exclusions; missing reports fail the action.                                                                      |              |                  |
|                         | Auto-detection may match no files. Exclusion patterns do not require a match.                                                                                        |              |                  |
|                         | Set to `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all` for automatic detection.                                                                             |              |                  |
|                         | Examples: `**/junit.xml`, `coverage/lcov.info`, `eslint-report.json`, `reports/results.sarif`, `auto:all`, `auto:test,coverage/lcov.info`, `auto:test,auto:coverage` |              |                  |
| **`report-name`**       | Name to display in the summary (e.g., `Test Results`, `Coverage Report`).                                                                                            | **false**    | `Report Summary` |
| **`include-passed`**    | Whether to include passed tests in the summary.                                                                                                                      | **false**    | `false`          |
| **`output-format`**     | Output format: comma-separated list of `summary`, `markdown`, `annotations`, or `all` for everything.                                                                | **false**    | `all`            |
| **`fail-on-error`**     | Whether to fail the action if any test failures are detected.                                                                                                        | **false**    | `false`          |
| **`path-mapping`**      | Path mapping(s) to rewrite file paths in reports (format: "from_path:to_path").                                                                                      | **false**    | -                |
|                         | Useful when tests/lints run in a different directory or container.                                                                                                   |              |                  |
|                         | Multiple mappings can be provided separated by newlines or commas.                                                                                                   |              |                  |
|                         | Examples:                                                                                                                                                            |              |                  |
|                         | - Single mapping: "/app/src:./src"                                                                                                                                   |              |                  |
|                         | - Multiple mappings: "/app/src:./src,/app/tests:./tests"                                                                                                             |              |                  |
|                         | - Multi-line: \|                                                                                                                                                     |              |                  |
|                         | /app/src:./src                                                                                                                                                       |              |                  |
|                         | /app/tests:./tests                                                                                                                                                   |              |                  |
| **`working-directory`** | Working directory where the action should operate.                                                                                                                   | **false**    | `.`              |
|                         | Can be absolute or relative to the repository root.                                                                                                                  |              |                  |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**              | **Description**                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`test-markdown`**     | Compact test-only Markdown with collapsed details. Empty when no test results were parsed.                                                  |
| **`coverage-markdown`** | Compact coverage-only Markdown with collapsed per-source details. Empty when no coverage was parsed.                                        |
| **`lint-markdown`**     | Compact lint-only Markdown with collapsed diagnostics. Empty when no lint reports were parsed; clean reports explicitly show zero findings. |
| **`markdown`**          | Generated Markdown output for PR comments                                                                                                   |
| **`summary`**           | Generated summary output                                                                                                                    |
| **`parsed-files`**      | List of parsed report files (JSON array)                                                                                                    |
| **`has-errors`**        | Whether any errors were detected in the reports                                                                                             |

<!-- outputs:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-parse--ci--reports-blue?logo=github-actions)](https://github.com/marketplace/actions/parse-ci-reports)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)

<!-- badges:end -->
<!-- examples:start -->
<!-- examples:end -->
<!-- contributing:start -->
<!-- contributing:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->
<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
