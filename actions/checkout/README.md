<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItZ2l0LWJyYW5jaCIgY29sb3I9ImJsdWUiPjxsaW5lIHgxPSI2IiB5MT0iMyIgeDI9IjYiIHkyPSIxNSI+PC9saW5lPjxjaXJjbGUgY3g9IjE4IiBjeT0iNiIgcj0iMyI+PC9jaXJjbGU+PGNpcmNsZSBjeD0iNiIgY3k9IjE4IiByPSIzIj48L2NpcmNsZT48cGF0aCBkPSJNMTggOWE5IDkgMCAwIDEtOSA5Ij48L3BhdGg+PC9zdmc+) GitHub Action: Checkout

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Checkout" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-checkout-blue?logo=github-actions)](https://github.com/marketplace/actions/checkout)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

Action to checkout the repository compatible for PRs, issues and push events.
Workaround for <https://github.com/actions/checkout/issues/331>](<https://github.com/actions/checkout/issues/331>.

<!-- overview:end -->

Set permissions to read contents and pull-requests. This is required to get the PR branch.

```yaml
on: issue_comment
permissions:
  contents: read
  pull-requests: read
```

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/checkout@a55670b58d3e064526201acde6c720ede638420c # 0.31.0
  with:
    # Number of commits to fetch. 0 indicates all history for all branches and tags.
    # See https://github.com/actions/checkout#usage
    #
    # Default: `1`
    fetch-depth: "1"

    # Whether to download Git-LFS files.
    # See https://github.com/actions/checkout#usage
    #
    # Default: `false`
    lfs: "false"

    # Whether to persist the token credentials in the Git config.
    # Default to false for security reasons.
    # See https://github.com/orgs/community/discussions/179107.
    #
    # Default: `false`
    persist-credentials: "false"

    # Token to use for checking out the repository instead of the default GITHUB_TOKEN.
    token: ""
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

| **Input**                 | **Description**                                                                   | **Required** | **Default** |
| ------------------------- | --------------------------------------------------------------------------------- | ------------ | ----------- |
| **`fetch-depth`**         | Number of commits to fetch. 0 indicates all history for all branches and tags.    | **false**    | `1`         |
|                           | See <https://github.com/actions/checkout#usage>                                   |              |             |
| **`lfs`**                 | Whether to download Git-LFS files.                                                | **false**    | `false`     |
|                           | See <https://github.com/actions/checkout#usage>                                   |              |             |
| **`persist-credentials`** | Whether to persist the token credentials in the Git config.                       | **false**    | `false`     |
|                           | Default to false for security reasons.                                            |              |             |
|                           | See <https://github.com/orgs/community/discussions/179107>.                       |              |             |
| **`token`**               | Token to use for checking out the repository instead of the default GITHUB_TOKEN. | **false**    | -           |

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
