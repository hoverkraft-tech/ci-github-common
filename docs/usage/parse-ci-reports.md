# Parse CI reports

The `test-markdown`, `coverage-markdown` and `lint-markdown` outputs separate
report types for consolidated publication. Each shows a short summary and
collapsed details. Independent coverage files retain their source labels and
percentages; they are not summed or averaged. Test details include suite counts
with failing suites first. A clean lint report shows zero findings; absent lint
reports leave `lint-markdown` empty.

Use the [CI reports workflow](../../.github/workflows/ci-reports.md) after lint
and test jobs to update three persistent comments from their native artifacts.
The shared [linter workflow](../../.github/workflows/linter.md) uploads its native
Super-Linter summary. Call it from a job named `lint`, set `comment: false`, and
include `lint` in the publisher's `needs`. The publisher reuses the summary
without translating linter statuses into diagnostic counts. CodeQL findings stay
in code scanning and Ratchet diagnostics stay in the workflow logs.

Job outcomes and missing reports remain visible above the collapsed report and
job details. Oversized sections link to full artifacts instead of producing
incomplete Markdown. Per-job summaries and merge checks remain available.

Explicit positive paths and glob patterns must each match at least one file
after exclusions. A missing report fails the action even when `fail-on-error`
is false; that option controls failures found inside reports. Use `auto:*` for
optional discovery, which warns when no files are found. Exclusion patterns do
not require a match.

## Supported Formats

### Test Reports

- **JUnit XML** - Standard format used by many testing frameworks, including nested PHPUnit suites. Aggregate suite totals are not counted as additional tests.
- **TAP (Test Anything Protocol)** - Popular in Perl and Node.js testing

### Coverage Reports

- **Cobertura XML** - Common coverage format (Python coverage, Java JaCoCo, etc.)
- **LCOV** - Standard coverage format (JavaScript/Node.js, C/C++)

### Lint/Check Reports

- **ESLint JSON** - JavaScript/TypeScript linting
- **CheckStyle XML** - Java and other language linting
- **SARIF** - Static analysis results in the SARIF 2.1.0 format
- **Prettier Check Logs** - Text output captured from `prettier --check`
- **Astro Check Logs** - Diagnostics emitted by `astro check`

## Expected Auto-Detection Paths

When `report-paths` uses `auto:test`, `auto:coverage`, `auto:lint`, or `auto:all`, the action searches for these glob patterns:

| **Report Type**         | **Auto-Detected Paths**                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **JUnit XML**           | `**/junit*.xml`, `**/test-results/**/*.xml`, `**/test-reports/**/*.xml`, `**/*test*.xml`                                                                                                                           |
| **TAP**                 | `**/*.tap`                                                                                                                                                                                                         |
| **Cobertura XML**       | `**/cobertura.xml`, `**/coverage/*-coverage.xml`, `**/coverage/*-cobertura.xml`, `**/coverage/coverage.xml`, `**/coverage/cobertura.xml`                                                                           |
| **LCOV**                | `**/coverage/lcov.info`, `**/lcov.info`, `**/coverage/*-lcov.info`, `**/*-lcov.info`                                                                                                                               |
| **ESLint JSON**         | `**/eslint-report.json`, `**/eslint.json`, `**/*-eslint-report.json`, `**/*-eslint.json`                                                                                                                           |
| **CheckStyle XML**      | `**/checkstyle-result.xml`, `**/checkstyle.xml`, `**/*-checkstyle-result.xml`, `**/*-checkstyle.xml`                                                                                                               |
| **SARIF**               | `**/*.sarif`, `**/*.sarif.json`, `**/sarif-report.json`, `**/*-sarif-report.json`                                                                                                                                  |
| **Prettier Check Logs** | `**/prettier-check.log`, `**/prettier-check.txt`, `**/prettier-report.log`, `**/prettier-report.txt`, `**/*-prettier-check.log`, `**/*-prettier-check.txt`, `**/*-prettier-report.log`, `**/*-prettier-report.txt` |
| **Astro Check Logs**    | `**/astro-check.log`, `**/astro-check.txt`, `**/astro-check-report.log`, `**/astro-check-report.txt`, `**/*-astro-check.log`, `**/*-astro-check.txt`, `**/*-astro-check-report.log`, `**/*-astro-check-report.txt` |

If your reports are written elsewhere, pass explicit paths or glob patterns instead of relying on `auto:*` detection.

## Examples

### Auto-Detection Mode

Let the action automatically find common report files:

```yaml
- name: Parse all CI reports
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
```

Or target specific report types:

```yaml
- name: Parse test reports only
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "**/test-results/*.xml"
    report-name: "Test Results"
    output-format: "markdown"

- name: Comment PR
  uses: peter-evans/create-or-update-comment@e8674b075228eee787fea43ef493e45ece1004c9 # v5.0.0
  with:
    issue-number: ${{ github.event.pull_request.number }}
    body: ${{ steps.parse-reports.outputs.markdown }}
```

### Generate GitHub Step Summary

```yaml
- name: Parse coverage
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "reports/results.sarif"
    report-name: "Static Analysis"
    output-format: "summary,annotations"
```

### Fail on Test Failures

```yaml
- name: Parse test reports
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "**/junit.xml"
    report-name: "Test Results"
    fail-on-error: "true"
```

### GitHub Annotations

Generate GitHub annotations for failed tests and linting issues:

```yaml
- name: Parse reports with annotations
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "annotations"
```

### Multiple Output Formats

Combine multiple output formats using comma-separated values:

```yaml
- name: Parse reports with multiple outputs
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "auto:all"
    report-name: "CI Results"
    output-format: "summary,annotations"
```

Or use "all" for all output formats:

```yaml
- name: Parse reports with all outputs
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: "**/test-results/*.xml"
    report-name: "Test Results"

- name: Comment on PR
  if: steps.parse-reports.outputs.has-errors == 'true'
  uses: peter-evans/create-or-update-comment@e8674b075228eee787fea43ef493e45ece1004c9 # v5.0.0
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
  uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@<commit-sha>
  with:
    report-paths: |
      pytest-results.xml
      target/surefire-reports/*.xml
    report-name: "Multi-language Test Results"
```
