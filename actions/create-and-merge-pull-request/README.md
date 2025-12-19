<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItZ2l0LXB1bGwtcmVxdWVzdCIgY29sb3I9ImJsdWUiPjxjaXJjbGUgY3g9IjE4IiBjeT0iMTgiIHI9IjMiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjYiIGN5PSI2IiByPSIzIj48L2NpcmNsZT48cGF0aCBkPSJNMTMgNmgzYTIgMiAwIDAgMSAyIDJ2NyI+PC9wYXRoPjxsaW5lIHgxPSI2IiB5MT0iOSIgeDI9IjYiIHkyPSIyMSI+PC9saW5lPjwvc3ZnPg==) GitHub Action: Create and merge Pull Request

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Create and merge Pull Request" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-create--and--merge--pull--request-blue?logo=github-actions)](https://github.com/marketplace/actions/create-and-merge-pull-request)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

Action to create and merge Pull Request.
Opinionated, set GitHub Actions bot as author, then rebase and merge.

For this action to work you must explicitly allow GitHub Actions to create pull requests.
See <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository>.

<!-- overview:end -->

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/create-and-merge-pull-request@b17226e57c8ef31f860719766656ebb6df017218 # 0.31.6
  with:
    # GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write).
    # See https://github.com/peter-evans/create-pull-request#action-inputs.
    #
    # Default: `${{ github.token }}`
    github-token: ${{ github.token }}

    # The pull request branch name
    # This input is required.
    branch: ""

    # The pull request title
    # This input is required.
    title: ""

    # The pull request body
    # This input is required.
    body: ""

    # The commit message for the pull request
    # This input is required.
    commit-message: ""
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

| **Input**            | **Description**                                                                                            | **Required** | **Default**           |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ | --------------------- |
| **`github-token`**   | GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write). | **false**    | `${{ github.token }}` |
|                      | See <https://github.com/peter-evans/create-pull-request#action-inputs>.                                    |              |                       |
| **`branch`**         | The pull request branch name                                                                               | **true**     | -                     |
| **`title`**          | The pull request title                                                                                     | **true**     | -                     |
| **`body`**           | The pull request body                                                                                      | **true**     | -                     |
| **`commit-message`** | The commit message for the pull request                                                                    | **true**     | -                     |

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

Copyright © 2025 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->

<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!--
// jscpd:ignore-end
-->
