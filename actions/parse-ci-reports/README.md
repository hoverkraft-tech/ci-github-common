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
- **Prettier Check Logs** - Text output captured from `prettier --check`
- **Astro Check Logs** - Diagnostics emitted by `astro check`

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    # Paths to report files (glob patterns supported, one per line or comma-separated).
    # Set to `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all` for automatic detection.
    # Examples: `**/junit.xml`, `coverage/lcov.info`, `eslint-report.json`, `auto:all`, `auto:test,coverage/lcov.info`, `auto:test,auto:coverage`
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

| **Input**               | **Description**                                                                                                                             | **Required** | **Default**      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- |
| **`report-paths`**      | Paths to report files (glob patterns supported, one per line or comma-separated).                                                           | **false**    | `auto:all`       |
|                         | Set to `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all` for automatic detection.                                                    |              |                  |
|                         | Examples: `**/junit.xml`, `coverage/lcov.info`, `eslint-report.json`, `auto:all`, `auto:test,coverage/lcov.info`, `auto:test,auto:coverage` |              |                  |
| **`report-name`**       | Name to display in the summary (e.g., `Test Results`, `Coverage Report`).                                                                   | **false**    | `Report Summary` |
| **`include-passed`**    | Whether to include passed tests in the summary.                                                                                             | **false**    | `false`          |
| **`output-format`**     | Output format: comma-separated list of `summary`, `markdown`, `annotations`, or `all` for everything.                                       | **false**    | `all`            |
| **`fail-on-error`**     | Whether to fail the action if any test failures are detected.                                                                               | **false**    | `false`          |
| **`path-mapping`**      | Path mapping(s) to rewrite file paths in reports (format: "from_path:to_path").                                                             | **false**    | -                |
|                         | Useful when tests/lints run in a different directory or container.                                                                          |              |                  |
|                         | Multiple mappings can be provided separated by newlines or commas.                                                                          |              |                  |
|                         | Examples:                                                                                                                                   |              |                  |
|                         | - Single mapping: "/app/src:./src"                                                                                                          |              |                  |
|                         | - Multiple mappings: "/app/src:./src,/app/tests:./tests"                                                                                    |              |                  |
|                         | - Multi-line: \|                                                                                                                            |              |                  |
|                         | /app/src:./src                                                                                                                              |              |                  |
|                         | /app/tests:./tests                                                                                                                          |              |                  |
| **`working-directory`** | Working directory where the action should operate.                                                                                          | **false**    | `.`              |
|                         | Can be absolute or relative to the repository root.                                                                                         |              |                  |

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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
```

Or target specific report types:

```yaml
- name: Parse test reports only
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "auto:test"
    report-name: "Test Results"
```

Auto-detection modes:

- `auto:test` - Finds JUnit XML and TAP files

- `auto:coverage` - Finds LCOV and Cobertura coverage files

- `auto:lint` - Finds ESLint JSON and CheckStyle XML files

- `auto:all` - Finds all supported report types

### Generate PR Comment

```yaml
- name: Parse test reports
  id: parse-reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "astro-check.log"
    report-name: "Astro Diagnostics"
    output-format: "summary,annotations"
```

### Fail on Test Failures

```yaml
- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "**/junit.xml"
    report-name: "Test Results"
    fail-on-error: "true"
```

### GitHub Annotations

Generate GitHub annotations for failed tests and linting issues:

```yaml
- name: Parse reports with annotations
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "annotations"
```

### Multiple Output Formats

Combine multiple output formats using comma-separated values:

```yaml
- name: Parse reports with multiple outputs
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "summary,annotations"
```

Or use "all" for all output formats:

```yaml
- name: Parse reports with all outputs
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
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

Copyright © 2025 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
