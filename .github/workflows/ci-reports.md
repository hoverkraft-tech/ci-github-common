<!-- header:start -->

# GitHub Reusable Workflow: CI reports

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="CI reports" />
</div>

---

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

Consolidate lint, test and coverage results after producer jobs.

Call once with producer jobs in needs, if: always(), and job-results: toJSON(needs).
Updated producer workflows supply their expected report plans automatically.
Standalone jobs forward the recording action's report-plan output. A custom
outer matrix forwards its complete plan from configuration, with producer.job
naming the matrix job; never use its last successful invocation as the inventory.

Collection, previews and uploads run independently. Only PR comment updates are
serialized. There is no caller concurrency group or repeated coverage inventory.

Select coverage: github for native Code Quality, codecov for Codecov, or none
(default) for summaries only. Producers must generate Cobertura for publication.
GitHub Code Quality must already be enabled. Use PR head coverage and also run on
default-branch pushes for a baseline. Frameworks merge shards before recording.
Required missing reports, failed producers and publication errors fail the
stable completion check. Partial reruns require rerunning all producer jobs.

Example, after lint and tests:

```yaml
reports:
  needs: [lint, tests]
  if: ${{ always() }}
  uses: hoverkraft-tech/ci-github-common/.github/workflows/ci-reports.yml@<commit-sha>
  permissions:
    contents: read
    pull-requests: write
    code-quality: write
    id-token: write
  with:
    job-results: ${{ toJSON(needs) }}
    coverage: github
```

Grant the union of the workflow's declared permissions at the calling job;
only the corresponding internal job receives each write permission.
Publishers execute no project scripts. Forks keep diagnostics without comments
or uploads. Native coverage also skips merge groups and upstream unsupported
contexts; a skipped upload does not establish native coverage enforcement.

### Permissions

- **`code-quality`**: `write`
- **`contents`**: `read`
- **`id-token`**: `write`
- **`pull-requests`**: `write`

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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/ci-reports.yml@af0bdd6313bd49aaf4a8a7f0de005fb0db856b03 # 4.3.3
    permissions:
      code-quality: write
      contents: read
      id-token: write
      pull-requests: write
    with:
      # JSON needs context containing completed producer jobs and their automatic report-plan outputs.
      # This input is required.
      job-results: ""

      # External coverage destination, none (summaries only), github (native Code Quality) or codecov. Requires planned Cobertura reports when enabled.
      # Default: `none`
      coverage: none

      # Update one persistent CI comment on same-repository pull requests. Summaries remain available when false.
      # Default: `true`
      comment: true
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**         | **Description**                                                                                                                                 | **Required** | **Type**    | **Default** |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ----------- |
| **`job-results`** | JSON needs context containing completed producer jobs and their automatic report-plan outputs.                                                  | **true**     | **string**  | -           |
| **`coverage`**    | External coverage destination, none (summaries only), github (native Code Quality) or codecov. Requires planned Cobertura reports when enabled. | **false**    | **string**  | `none`      |
| **`comment`**     | Update one persistent CI comment on same-repository pull requests. Summaries remain available when false.                                       | **false**    | **boolean** | `true`      |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                                          |
| ----------------- | ------------------------------------------------------------------------ |
| **`markdown`**    | Consolidated CI feedback with producer outcomes and report availability. |
| **`artifact-id`** | Validated collection and diagnostics artifact ID.                        |

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
