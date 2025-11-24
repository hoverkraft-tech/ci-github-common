<!-- header:start -->

# GitHub Reusable Workflow: Mark stale issues and pull requests

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Mark stale issues and pull requests" />
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

Reusable workflow to manage stale issues and pull requests.
Mainly using [Stale Action](https://github.com/actions/stale), with some opinionated defaults.

### Permissions

- **`issues`**: `write`
- **`pull-requests`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

```yaml
name: Mark stale issues and pull requests
on:
  schedule:
    - cron: 30 1 * * *
permissions: {}
jobs:
  stale:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/stale.yml@5e8d0e6d1e76d8577a070db6d0128a91b1c9d5ad # 0.30.2
    permissions: {}
    with:
      # JSON array of runner(s) to use.
      # See https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job.
      #
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # Comment on the staled issues.
      # See https://github.com/actions/stale#stale-issue-message.
      # Default: This issue is stale
      stale-issue-message: ""

      # Comment on the staled PRs.
      # See https://github.com/actions/stale#stale-pr-message.
      # Default: This PR is stale
      stale-pr-message: ""

      # Label to apply on staled issues.
      # See https://github.com/actions/stale#stale-issue-label.
      # Default: no-issue-activity
      stale-issue-label: ""

      # Labels on issues exempted from stale.
      # See https://github.com/actions/stale#exempt-issue-labels.
      # Default: awaiting-approval,work-in-progress
      exempt-issue-labels: ""

      # Label to apply on staled PRs.
      # See https://github.com/actions/stale#stale-pr-label.
      # Default: no-pr-activity
      stale-pr-label: ""

      # Labels on PRs exempted from stale.
      # See https://github.com/actions/stale#exempt-pr-labels.
      # Default: awaiting-approval,work-in-progress
      exempt-pr-labels: ""
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                 | **Description**                                                                    | **Required** | **Type**   | **Default**         |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------ | ---------- | ------------------- |
| **`runs-on`**             | JSON array of runner(s) to use.                                                    | **false**    | **string** | `["ubuntu-latest"]` |
|                           | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>. |              |            |                     |
| **`stale-issue-message`** | Comment on the staled issues.                                                      | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#stale-issue-message>.                        |              |            |                     |
|                           | Default: This issue is stale                                                       |              |            |                     |
| **`stale-pr-message`**    | Comment on the staled PRs.                                                         | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#stale-pr-message>.                           |              |            |                     |
|                           | Default: This PR is stale                                                          |              |            |                     |
| **`stale-issue-label`**   | Label to apply on staled issues.                                                   | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#stale-issue-label>.                          |              |            |                     |
|                           | Default: no-issue-activity                                                         |              |            |                     |
| **`exempt-issue-labels`** | Labels on issues exempted from stale.                                              | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#exempt-issue-labels>.                        |              |            |                     |
|                           | Default: awaiting-approval,work-in-progress                                        |              |            |                     |
| **`stale-pr-label`**      | Label to apply on staled PRs.                                                      | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#stale-pr-label>.                             |              |            |                     |
|                           | Default: no-pr-activity                                                            |              |            |                     |
| **`exempt-pr-labels`**    | Labels on PRs exempted from stale.                                                 | **false**    | **string** | -                   |
|                           | See <https://github.com/actions/stale#exempt-pr-labels>.                           |              |            |                     |
|                           | Default: awaiting-approval,work-in-progress                                        |              |            |                     |

<!-- inputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- outputs:start -->
<!-- outputs:end -->

<!-- examples:start -->
<!-- examples:end -->

<!--
// jscpd:ignore-start
-->

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

Copyright © 2025 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->

<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!--
// jscpd:ignore-end
-->
