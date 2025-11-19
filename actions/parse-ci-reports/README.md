# Parse CI Reports

Parse CI reports (tests, linting, coverage) into GitHub summary and Markdown for PR comments.

## Description

This action parses various report formats from testing, linting, and coverage tools and generates:

- GitHub Step Summaries for workflow runs
- Markdown output suitable for pull request or issue comments

It supports multiple common report standards out of the box.

## Supported Formats

### Test Reports

- **JUnit XML** - Standard format used by many testing frameworks (Java, Python pytest, JavaScript Jest, etc.)
- **TAP (Test Anything Protocol)** - Popular in Perl and Node.js testing

### Coverage Reports

- **Cobertura XML** - Common coverage format (Python coverage, Java JaCoCo, etc.)
- **LCOV** - Standard coverage format (JavaScript/Node.js, C/C++)

### Lint/Check Reports

- **ESLint JSON** - JavaScript/TypeScript linting
- **CheckStyle XML** - Java and other language linting

## Usage

### Basic Example

```yaml
- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
  with:
    report-paths: |
      **/junit.xml
      coverage/lcov.info
      eslint-report.json
    report-name: "CI Results"
```

### Generate PR Comment

```yaml
- name: Parse test reports
  id: parse-reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
  with:
    report-paths: "coverage/cobertura-coverage.xml"
    report-name: "Coverage Report"
    output-format: "summary"
```

### Fail on Test Failures

```yaml
- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
  with:
    report-paths: "**/junit.xml"
    report-name: "Test Results"
    fail-on-error: "true"
```

## Inputs

| Input            | Description                                                                      | Required | Default            |
| ---------------- | -------------------------------------------------------------------------------- | -------- | ------------------ |
| `report-paths`   | Paths to report files (glob patterns supported, one per line or comma-separated) | Yes      | -                  |
| `report-name`    | Name to display in the summary                                                   | No       | `"Report Summary"` |
| `include-passed` | Whether to include passed tests in the summary                                   | No       | `false`            |
| `output-format`  | Output format: 'summary', 'Markdown', or 'both'                                  | No       | `"both"`           |
| `fail-on-error`  | Whether to fail the action if any test failures are detected                     | No       | `false`            |

## Outputs

| Output                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `markdown`            | Generated Markdown output for PR comments         |
| `summary`             | Generated summary output                          |
| `total-tests`         | Total number of tests                             |
| `passed-tests`        | Number of passed tests                            |
| `failed-tests`        | Number of failed tests                            |
| `skipped-tests`       | Number of skipped tests                           |
| `coverage-percentage` | Overall coverage percentage (if available)        |
| `has-errors`          | Whether any errors were found (`true` or `false`) |

## Examples

### Multiple Report Types

Parse test results, coverage, and linting in one action:

```yaml
- name: Run tests
  run: npm test

- name: Run linter
  run: npm run lint -- --format json --output-file eslint-report.json

- name: Parse all reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
  with:
    report-paths: |
      test-results/junit.xml
      coverage/lcov.info
      eslint-report.json
    report-name: "CI Results"
```

### Conditional PR Comment

Only comment on PRs if there are failures:

```yaml
- name: Parse test reports
  id: parse-reports
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
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
  uses: hoverkraft-tech/ci-github-common/actions/parse-ci-reports@v1
  with:
    report-paths: |
      pytest-results.xml
      target/surefire-reports/*.xml
    report-name: "Multi-language Test Results"
```

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
│   └── ParserFactory.js  # Factory pattern for parser selection
├── formatters/      # Output formatters
│   ├── SummaryFormatter.js
│   └── MarkdownFormatter.js
└── index.js         # Main orchestration
```

## Development

### Running Tests

```bash
cd actions/parse-ci-reports
npm install
npm test
```

### Adding New Parsers

1. Create a new parser class extending `BaseParser`
2. Implement `canParse()`, `parse()`, and `getPriority()` methods
3. Add the parser to `ParserFactory`
4. Add tests for the new parser

## License

MIT

Copyright © 2025 hoverkraft-tech
