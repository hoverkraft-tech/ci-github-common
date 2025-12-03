<!-- header:start -->

# GitHub Reusable Workflow: Greetings

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Greetings" />
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

Workflow to greet new contributors.
Mainly using [First Interaction Action](https://github.com/actions/first-interaction), with some opinionated defaults.

- On issue creation, a comment is added to the issue.
- On first contribution, a comment is added to the pull request.

### Permissions

- **`contents`**: `read`
- **`issues`**: `write`
- **`pull-requests`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

```yaml
name: Greetings
on:
  issues:
    types:
      - opened
  pull_request_target:
    branches:
      - main
permissions: {}
jobs:
  greetings:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/greetings.yml@5ac504609f6ef35c5ac94bd8199063aa32104721 # 0.31.3
    permissions: {}
    secrets:
      # Token for the repository.
      # See https://github.com/actions/first-interaction#usage.
      # Defaults to the GITHUB_TOKEN secret.
      github-token: ""
    with:
      # JSON array of runner(s) to use.
      # See https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job.
      #
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # Comment to post on an individual's first issue.
      # See https://github.com/actions/first-interaction#usage.
      #
      # Default: `Hi, thank for reporting an issue, we will check it out very soon`
      issue_message: Hi, thank for reporting an issue, we will check it out very soon

      # Comment to post on an individual's first pull request.
      # See https://github.com/actions/first-interaction#usage.
      #
      # Default: `Hi, thank you for creating your PR, we will check it out very soon`
      pr_message: Hi, thank you for creating your PR, we will check it out very soon
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**           | **Description**                                                                    | **Required** | **Type**   | **Default**                                                          |
| ------------------- | ---------------------------------------------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------------- |
| **`runs-on`**       | JSON array of runner(s) to use.                                                    | **false**    | **string** | `["ubuntu-latest"]`                                                  |
|                     | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>. |              |            |                                                                      |
| **`issue_message`** | Comment to post on an individual's first issue.                                    | **false**    | **string** | `Hi, thank for reporting an issue, we will check it out very soon`   |
|                     | See <https://github.com/actions/first-interaction#usage>.                          |              |            |                                                                      |
| **`pr_message`**    | Comment to post on an individual's first pull request.                             | **false**    | **string** | `Hi, thank you for creating your PR, we will check it out very soon` |
|                     | See <https://github.com/actions/first-interaction#usage>.                          |              |            |                                                                      |

<!-- inputs:end -->

<!-- secrets:start -->

## Secrets

| **Secret**         | **Description**                                           | **Required** |
| ------------------ | --------------------------------------------------------- | ------------ |
| **`github-token`** | Token for the repository.                                 | **false**    |
|                    | See <https://github.com/actions/first-interaction#usage>. |              |
|                    | Defaults to the GITHUB_TOKEN secret.                      |              |

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
