<!-- header:start -->

# GitHub Reusable Workflow: CI reports

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

One reporting boundary for the whole originating workflow run.
Put every participating producer (including reusable matrix jobs) in needs and
use if: always(). Forward only job-results: toJSON(needs); no report inventory.

Defaults: lint and test results use annotations. Coverage uses GitHub Code
Quality when positively available, with a PR comment fallback otherwise.
Select newline-separated reporters, or an empty string to disable publication.
Evidence validation and the final CI reports complete check remain required.
See docs/usage/ci-reports.md for permissions, examples and the report contract.

### Permissions

- **`actions`**: `read`
- **`code-quality`**: `write`
- **`contents`**: `read`
- **`id-token`**: `write`
- **`pull-requests`**: `write`
- **`security-events`**: `write`

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
name: CI reports
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  ci-reports:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/ci-reports.yml@beab1278f3b6e89f3c2e91e774071efb82073a6c # feat/native-github-coverage
    permissions:
      actions: read
      code-quality: write
      contents: read
      id-token: write
      pull-requests: write
      security-events: write
    secrets:
      # Optional Codecov token. Without it, Codecov uses GitHub OIDC.
      codecov-token: ""
    with:
      # JSON needs context for every completed producer in the originating workflow.
      # This input is required.
      job-results: ""

      # Newline-separated annotations, comment, code-scanning. Empty disables publication.
      # Default: `annotations`
      lint-reporters: annotations

      # Newline-separated annotations, comment. Empty disables publication.
      # Default: `annotations`
      test-results-reporters: annotations

      # Newline-separated `auto`, `github`, `codecov`, `coveralls`, `comment`. Auto uses GitHub when available, then comment or summary. Explicit `github` is required.
      # Default: `auto`
      test-coverage-reporters: auto
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                     | **Description**                                                                                                                                                 | **Required** | **Type**   | **Default**   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------- |
| **`job-results`**             | JSON needs context for every completed producer in the originating workflow.                                                                                    | **true**     | **string** | -             |
| **`lint-reporters`**          | Newline-separated annotations, comment, code-scanning. Empty disables publication.                                                                              | **false**    | **string** | `annotations` |
| **`test-results-reporters`**  | Newline-separated annotations, comment. Empty disables publication.                                                                                             | **false**    | **string** | `annotations` |
| **`test-coverage-reporters`** | Newline-separated `auto`, `github`, `codecov`, `coveralls`, `comment`. Auto uses GitHub when available, then comment or summary. Explicit `github` is required. | **false**    | **string** | `auto`        |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| **`markdown`**    | Final summary after all publication attempts, including comment delivery. |
| **`artifact-id`** | Validated report collection artifact ID.                                  |

<!-- outputs:end -->
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

Copyright © 2026 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
