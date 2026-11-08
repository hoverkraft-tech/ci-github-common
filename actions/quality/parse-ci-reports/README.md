<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stY2lyY2xlIiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjIyIDQgMTIgMTQuMDEgOSAxMS4wMSI+PC9wb2x5bGluZT48L3N2Zz4=) GitHub Action: Parse CI Reports

<div align="center">
  <img src="../../../.github/logo.svg" width="60px" align="center" alt="Parse CI Reports" />
</div>

---

<!-- header:end -->
<!-- overview:start -->

## Overview

Parse CI reports (tests, linting, coverage) into GitHub summary and Markdown for PR comments.
This action parses various report formats from testing, linting, and coverage tools and generates:

- GitHub Step Summaries for workflow runs
- Markdown output suitable for pull request or issue comments
- GitHub Annotations for failed tests and linting issues

It supports multiple common report standards out of the box.

See the [formats and examples guide](../../../docs/usage/parse-ci-reports.md)
and the [development guide](../../../docs/development/parse-ci-reports.md).

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/parse-ci-reports@90211d735aa0289702ddbd7eb95b218020ccadad # 2.0.2
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
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- examples:start -->
<!-- examples:end -->
<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->
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
