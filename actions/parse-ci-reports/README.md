<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stY2lyY2xlIiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjIyIDQgMTIgMTQuMDEgOSAxMS4wMSI+PC9wb2x5bGluZT48L3N2Zz4=) GitHub Action: Parse CI Reports

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Parse CI Reports" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-parse--ci--reports-blue?logo=github-actions)](https://github.com/marketplace/actions/parse-ci-reports)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Parse CI reports (tests, linting, coverage) into GitHub summary and Markdown for PR comments.
This action parses various report formats from testing, linting, and coverage tools and generates:

- GitHub Step Summaries for workflow runs
- Markdown output suitable for pull request or issue comments
- GitHub Annotations for failed tests and linting issues

It supports multiple common report standards out of the box.

<!-- overview:end -->

### Supported Formats

#### Test Reports

- **JUnit XML** - Standard format used by many testing frameworks (Java, Python pytest, JavaScript Jest, etc.)
- **TAP (Test Anything Protocol)** - Popular in Perl and Node.js testing

#### Coverage Reports

- **Cobertura XML** - Common coverage format (Python coverage, Java JaCoCo, etc.)
- **LCOV** - Standard coverage format (JavaScript/Node.js, C/C++)

#### Lint/Check Reports

- **ESLint JSON** - JavaScript/TypeScript linting
- **CheckStyle XML** - Java and other language linting
- **SARIF** - Static analysis results in the SARIF 2.1.0 format
- **Prettier Check Logs** - Text output captured from `prettier --check`
- **Astro Check Logs** - Diagnostics emitted by `astro check`

### Expected Auto-Detection Paths

When `report-paths` uses `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all`, the action searches for these glob patterns:

| **Report Type**         | **Auto-Detected Paths**                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **JUnit XML**           | `**/junit*.xml`, `**/test-results/**/*.xml`, `**/test-reports/**/*.xml`, `**/*test*.xml`                                                                                                                           |
| **TAP**                 | `**/*.tap`                                                                                                                                                                                                         |
| **Cobertura XML**       | `**/coverage/*-coverage.xml`, `**/coverage/*-cobertura.xml`, `**/coverage/coverage.xml`, `**/coverage/cobertura.xml`                                                                                               |
| **LCOV**                | `**/coverage/lcov.info`, `**/lcov.info`, `**/coverage/*-lcov.info`, `**/*-lcov.info`                                                                                                                               |
| **ESLint JSON**         | `**/eslint-report.json`, `**/eslint.json`, `**/*-eslint-report.json`, `**/*-eslint.json`                                                                                                                           |
| **CheckStyle XML**      | `**/checkstyle-result.xml`, `**/checkstyle.xml`, `**/*-checkstyle-result.xml`, `**/*-checkstyle.xml`                                                                                                               |
| **SARIF**               | `**/*.sarif`, `**/*.sarif.json`, `**/sarif-report.json`, `**/*-sarif-report.json`                                                                                                                                  |
| **Prettier Check Logs** | `**/prettier-check.log`, `**/prettier-check.txt`, `**/prettier-report.log`, `**/prettier-report.txt`, `**/*-prettier-check.log`, `**/*-prettier-check.txt`, `**/*-prettier-report.log`, `**/*-prettier-report.txt` |
| **Astro Check Logs**    | `**/astro-check.log`, `**/astro-check.txt`, `**/astro-check-report.log`, `**/astro-check-report.txt`, `**/*-astro-check.log`, `**/*-astro-check.txt`, `**/*-astro-check-report.log`, `**/*-astro-check-report.txt` |

If your reports are written elsewhere, pass explicit paths or glob patterns instead of relying on `auto:*` detection.

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    # Paths to report files (glob patterns supported, one per line or comma-separated).
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

| **Output**         | **Description**                                 |
| ------------------ | ----------------------------------------------- |
| **`markdown`**     | Generated Markdown output for PR comments       |
| **`summary`**      | Generated summary output                        |
| **`parsed-files`** | List of parsed report files (JSON array)        |
| **`has-errors`**   | Whether any errors were detected in the reports |

<!-- outputs:end -->
<!-- examples:start -->

## Examples

### Auto-Detection Mode

Let the action automatically find common report files:

```yaml
- name: Parse all CI reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
```

Or target specific report types:

```yaml
- name: Parse test reports only
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:test"
    report-name: "Test Results"
```

Auto-detection modes:

- `auto:test` - Finds JUnit XML and TAP files

- `auto:coverage` - Finds LCOV and Cobertura coverage files

- `auto:lint` - Finds ESLint JSON, CheckStyle XML, SARIF files, Prettier check logs, and Astro check logs

- `auto:all` - Finds all supported report types

### Generate PR Comment

```yaml
- name: Parse test reports
  id: parse-reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "**/test-results/*.xml"
    report-name: "Test Results"
    output-format: "markdown"

- name: Comment PR
  uses: peter-evans/create-or-update-comment@v3
  with:
    issue-number: ${{ github.event.pull_request.number }}
    body: ${{ steps.parse-reports.outputs.markdown }}
```

### Generate GitHub Step Summary

```yaml
- name: Parse coverage
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "coverage/cobertura-coverage.xml"
    report-name: "Coverage Report"
    output-format: "summary"
```

### Prettier Formatting Check

Capture the output of `prettier --check` and feed it to the parser to surface

formatting issues alongside other lint results:

```yaml
- name: Run Prettier check
  run: |
    npx prettier --check "src/**/*.{js,ts,tsx}" | tee prettier-check.log

- name: Parse Prettier report
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "prettier-check.log"
    report-name: "Prettier Formatting"
    output-format: "summary"
```

### Astro Type Checking

`astro check` reports diagnostics for `.astro` files, TypeScript code, and

content collections. Capture the CLI output and feed it to the parser to surface

errors (or warnings when `--minimumFailingSeverity` is relaxed) alongside other

linting tools:

```yaml
- name: Run astro check
  run: |
    npx astro check --minimumFailingSeverity warning | tee astro-check.log

- name: Parse astro diagnostics
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "astro-check.log"
    report-name: "Astro Diagnostics"
    output-format: "summary,annotations"
```

### SARIF Static Analysis

Parse SARIF output from tools such as CodeQL or other static analyzers:

```yaml
- name: Run static analysis
  run: codeql database analyze db javascript-security-extended --format=sarif-latest --output=reports/results.sarif

- name: Parse SARIF report
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "reports/results.sarif"
    report-name: "Static Analysis"
    output-format: "summary,annotations"
```

### Fail on Test Failures

```yaml
- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "**/junit.xml"
    report-name: "Test Results"
    fail-on-error: "true"
```

### GitHub Annotations

Generate GitHub annotations for failed tests and linting issues:

```yaml
- name: Parse reports with annotations
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "annotations"
```

### Multiple Output Formats

Combine multiple output formats using comma-separated values:

```yaml
- name: Parse reports with multiple outputs
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "summary,annotations"
```

Or use "all" for all output formats:

```yaml
- name: Parse reports with all outputs
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:test"
    report-name: "Test Results"
    output-format: "all"
```

### Multiple Report Types

Parse test results, coverage, and linting in one action:

```yaml
- name: Run tests
  run: npm test

- name: Run linter
  run: npm run lint -- --format json --output-file eslint-report.json

- name: Parse all reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: |
      test-results/junit.xml
      coverage/lcov.info
      eslint-report.json
    report-name: "CI Results"
```

### Run from a Subdirectory

When working in a monorepo or nested package, set `working-directory` so glob patterns are evaluated relative to that folder:

```yaml
- name: Parse frontend reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    working-directory: packages/frontend
    report-paths: |
      coverage/lcov.info
      reports/junit.xml
    report-name: "Frontend CI"
```

### Path Rewriting for Containers

When running tests in a container or different directory, use path-mapping to ensure file paths match your repository structure:

```yaml
- name: Run tests in container
  run: |
    docker run --rm -v ${{ github.workspace }}:/app myimage npm test

- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "test-results/junit.xml"
    report-name: "Test Results"
    path-mapping: "/app:."
    output-format: "annotations"
```

This ensures GitHub annotations point to the correct files in your repository, even when tests run in `/app` inside the container.

### Multiple Path Mappings

When you have multiple source directories that need rewriting, provide multiple mappings separated by newlines or commas:

```yaml
- name: Parse reports with multiple path mappings
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    path-mapping: |
      /app/src:./src
      /app/tests:./tests
      /app/lib:./lib
    output-format: "annotations"
```

Or using comma-separated format:

```yaml
- name: Parse reports with multiple path mappings
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    path-mapping: "/app/src:./src,/app/tests:./tests,/app/lib:./lib"
    output-format: "annotations"
```

The first matching mapping is applied to each file path. This is useful when dealing with complex project structures or monorepos where different parts of the codebase run in different directories.

Another example for complex Docker overlay paths:

```yaml
- name: Parse reports with path rewriting
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    path-mapping: "/var/lib/docker/overlay2/abc123/merged/workspace:./src"
```

### Conditional PR Comment

Only comment on PRs if there are failures:

```yaml
- name: Parse test reports
  id: parse-reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: "**/test-results/*.xml"
    report-name: "Test Results"

- name: Comment on PR
  if: steps.parse-reports.outputs.has-errors == 'true'
  uses: peter-evans/create-or-update-comment@v3
  with:
    issue-number: ${{ github.event.pull_request.number }}
    body: |
      ## ⚠️ Test Failures Detected

      ${{ steps.parse-reports.outputs.markdown }}
```

### Using with Multiple Test Frameworks

```yaml
- name: Run Python tests
  run: pytest --junit-xml=pytest-results.xml

- name: Run Java tests
  run: mvn test

- name: Parse all test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@4bb7594b1bf3696c54b2bbae970376056853f8ea # 0.36.0
  with:
    report-paths: |
      pytest-results.xml
      target/surefire-reports/*.xml
    report-name: "Multi-language Test Results"
```

<!-- examples:end -->
<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->

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
└── index-action.js      # GitHub Actions entrypoint
```

### Development

#### Running Tests

```bash
cd actions/parse-ci-reports
npm install
npm test
```

#### Adding New Parsers

1. Create a new parser class extending `BaseParser`
2. Implement `canParse()`, `parse()`, and `getPriority()` methods
3. Add the parser to `ParserFactory`
4. Add tests for the new parser

<!-- security:start -->
<!-- security:end -->
<!-- license:start -->

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2026 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
