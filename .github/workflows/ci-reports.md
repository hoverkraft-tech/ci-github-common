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

<!-- badges:end -->
<!-- overview:start -->

## Overview

Collect native reports after lint and test jobs and update one PR comment per report type.

Call once with `needs` listing the lint and test jobs, `if: always()` and
`job-results: ${{ toJSON(needs) }}`. Keep producer jobs as required checks.
Producers must disable individual comments and upload only report files in
artifacts named `ci-reports-<run_attempt>-<job ID>-<unique name>`. Use the same
job IDs in the caller and its reusable workflows, or set the producer's report
group to its outer calling job ID. Only artifacts belonging to these jobs are
downloaded. Directories are kept
separate so identically named reports cannot overwrite one another.
The shared linter uploads its native `super-linter-summary.md`; call it from
a job named `lint` with `comment: false`. Other lint producers can upload any
lint format supported by parse-ci-reports (ESLint, SARIF, Checkstyle, etc.).
Comments show concise totals with report and job details collapsed by default.

Only this run's current attempt is read. When rerunning failed jobs, reports
from jobs that did not rerun are explicitly unavailable; rerun all jobs for a
complete report. Missing reports never imply successful tests. Coverage stays
separate per source report; percentages are never averaged.
GitHub's abandoned reusable-job results remain visible with a warning;
they do not establish success, even when individual reports contain no failures.

Grant contents: read and pull-requests: write. Fork PRs retain
summaries without commenting. Use the caller's concurrency to cancel superseded
runs. This workflow serializes publication and rejects an outdated PR head.

### Permissions

- **`contents`**: `read`
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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/ci-reports.yml@ce885f8dd6bf7191a79e3eebdf37bca805d40932 # 3.0.0
    permissions:
      contents: read
      pull-requests: write
    with:
      # Publish combined PR comments. Disable for report previews or workflow tests; summaries and outputs remain available.
      # Default: `true`
      comment: true

      # JSON needs context containing lint and test jobs and their results.
      # This input is required.
      job-results: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**         | **Description**                                                                                                      | **Required** | **Type**    | **Default** |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ----------- |
| **`comment`**     | Publish combined PR comments. Disable for report previews or workflow tests; summaries and outputs remain available. | **false**    | **boolean** | `true`      |
| **`job-results`** | JSON needs context containing lint and test jobs and their results.                                                  | **true**     | **string**  | -           |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**              | **Description**                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **`lint-markdown`**     | Consolidated lint report, including native Super-Linter summaries and parsed diagnostics. |
| **`test-markdown`**     | Consolidated test report, including job status and missing-report information.            |
| **`coverage-markdown`** | Consolidated coverage report with separate source sections.                               |

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
