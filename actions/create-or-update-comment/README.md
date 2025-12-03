<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItbWVzc2FnZS1zcXVhcmUiIGNvbG9yPSJibHVlIj48cGF0aCBkPSJNMjEgMTVhMiAyIDAgMCAxLTIgMkg3bC00IDRWNWEyIDIgMCAwIDEgMi0yaDE0YTIgMiAwIDAgMSAyIDJ6Ij48L3BhdGg+PC9zdmc+) GitHub Action: Create or update comment

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Create or update comment" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-create--or--update--comment-blue?logo=github-actions)](https://github.com/marketplace/actions/create-or-update-comment)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

Action to create or update comment in pull request or issue.

<!-- overview:end -->

Set permissions to write issues and pull-requests. This is required to write the comment on the PR.

```yaml
permissions:
  issues: write
  pull-requests: write
```

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/create-or-update-comment@5ac504609f6ef35c5ac94bd8199063aa32104721 # 0.31.3
  with:
    # The comment title.
    # Must be static and unique, will be used to retrieve the comment if exists already.
    #
    # This input is required.
    title: ""

    # The comment body.
    # See https://github.com/peter-evans/create-or-update-comment.
    body: ""

    # A comma separated list of reactions to add to the comment.
    # See https://github.com/peter-evans/create-or-update-comment.
    reactions: ""

    # The comment author.
    # Default: `github-actions[bot]`
    comment-author: github-actions[bot]

    # Optional token to interact with GitHub API.
    # If not defined or empty, the action will use the GITHUB_TOKEN provided by GitHub.
    token: ""
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

| **Input**            | **Description**                                                                    | **Required** | **Default**           |
| -------------------- | ---------------------------------------------------------------------------------- | ------------ | --------------------- |
| **`title`**          | The comment title.                                                                 | **true**     | -                     |
|                      | Must be static and unique, will be used to retrieve the comment if exists already. |              |                       |
| **`body`**           | The comment body.                                                                  | **false**    | -                     |
|                      | See <https://github.com/peter-evans/create-or-update-comment>.                     |              |                       |
| **`reactions`**      | A comma separated list of reactions to add to the comment.                         | **false**    | -                     |
|                      | See <https://github.com/peter-evans/create-or-update-comment>.                     |              |                       |
| **`comment-author`** | The comment author.                                                                | **false**    | `github-actions[bot]` |
| **`token`**          | Optional token to interact with GitHub API.                                        | **false**    | -                     |
|                      | If not defined or empty, the action will use the GITHUB_TOKEN provided by GitHub.  |              |                       |

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
