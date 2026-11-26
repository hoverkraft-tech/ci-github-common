<!-- header:start -->

# GitHub Reusable Workflow: Publish coverage

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Publish coverage" />
</div>

---

<!-- header:end -->
<!-- overview:start -->

## Overview

Publish the complete Cobertura collection produced by ci-reports.

Enable GitHub Code Quality on the repository first. Its documented plans are
GitHub Team and Enterprise Cloud. This workflow does not change repository
settings, enable AI features or configure rulesets.

Call this workflow after ci-reports with its coverage-artifact-id and
coverage-reports outputs. Grant code-quality: write only to this calling job.
Keep ci-reports, producer checks and Coverage publication complete required.
GitHub coverage rules do not wait for uploads; 0 disables a rule threshold.
For supported events and the latest commit, the uploader waits for processing
and fails on upload or processing errors. Its documented skips (forks,
merge_group events and outdated commits) do not establish native coverage.

Reports from forks and merge_group events remain available as artifacts and
summaries; the official uploader does not support native coverage for them.
Native comparisons use the default branch baseline. Generate the same labeled
components on pull requests and default-branch pushes. Keep branch/function
coverage thresholds in the test framework because GitHub evaluates lines only.
This workflow downloads report data and executes no code from the tested project.

### Permissions

- **`code-quality`**: `write`
- **`pull-requests`**: `read`

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
name: Publish coverage
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  publish-coverage:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/publish-coverage.yml@6535a964c5ba86fe0baab0fb5a41a066587a8688 # feat/native-github-coverage
    permissions:
      code-quality: write
      pull-requests: read
    with:
      # Validated coverage artifact ID from ci-reports in this run and attempt.
      # This input is required.
      artifact-id: ""

      # JSON report array from ci-reports coverage-reports output. Each entry includes file, language and label.
      # This input is required.
      reports: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**         | **Description**                                                                                          | **Required** | **Type**   | **Default** |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ----------- |
| **`artifact-id`** | Validated coverage artifact ID from ci-reports in this run and attempt.                                  | **true**     | **string** | -           |
| **`reports`**     | JSON report array from ci-reports coverage-reports output. Each entry includes file, language and label. | **true**     | **string** | -           |

<!-- inputs:end -->
<!-- outputs:start -->
<!-- outputs:end -->
