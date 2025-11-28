<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItZG93bmxvYWQiIGNvbG9yPSJibHVlIj48cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjcgMTAgMTIgMTUgMTcgMTAiPjwvcG9seWxpbmU+PGxpbmUgeDE9IjEyIiB5MT0iMTUiIHgyPSIxMiIgeTI9IjMiPjwvbGluZT48L3N2Zz4=) GitHub Action: Local workflow actions

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Local workflow actions" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-local--workflow--actions-blue?logo=github-actions)](https://github.com/marketplace/actions/local-workflow-actions)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

This action checks out the reusable workflow repository that triggered the current run and copies its local actions directory into the current workspace.
It runs both during the main step and in the post step so that actions with cleanup hooks are also available.
Use it when consuming reusable workflows that reference local actions from the same repository—they are not automatically available in the caller repository and must be synced manually.
Add the `self-workflow` directory to your `.gitignore` and `.dockerignore` files to avoid committing it by mistake.

**This action requires the permission: `id-token: write`**.

Local actions will be available at `./<local-path>/<actions-path>` inside the current workspace.
Example: if `local-path` is `./self-workflow` and `actions-path` is `.github/actions`, then local actions will be available at `./self-workflow/.github/actions`.

<!-- overview:end -->

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/local-workflow-actions@a55670b58d3e064526201acde6c720ede638420c # 0.31.0
  with:
    # Relative path(s) (inside the workflow repository) containing the local actions to expose in the current workspace.
    # The same relative path will be used inside the current workspace (for example `.github/actions`).
    #
    # Default: `.github/actions`
    actions-path: .github/actions

    # Path inside the current workspace where to copy the local actions from the reusable workflow repository.
    #
    # Default: `./self-workflow`
    local-path: ./self-workflow

    # The reusable workflow repository that triggered the current run, in the format `owner/repo`.
    # If not provided, this is automatically filled by the OIDC action.
    repository: ""

    # The git ref (branch, tag, or SHA) of the reusable workflow repository that triggered the current run.
    # If not provided, this is automatically filled by the OIDC action.
    ref: ""
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

| **Input**          | **Description**                                                                                                    | **Required** | **Default**       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------ | ----------------- |
| **`actions-path`** | Relative path(s) (inside the workflow repository) containing the local actions to expose in the current workspace. | **false**    | `.github/actions` |
|                    | The same relative path will be used inside the current workspace (for example `.github/actions`).                  |              |                   |
| **`local-path`**   | Path inside the current workspace where to copy the local actions from the reusable workflow repository.           | **false**    | `./self-workflow` |
| **`repository`**   | The reusable workflow repository that triggered the current run, in the format `owner/repo`.                       | **false**    | -                 |
|                    | If not provided, this is automatically filled by the OIDC action.                                                  |              |                   |
| **`ref`**          | The Git ref (branch, tag, or SHA) of the reusable workflow repository that triggered the current run.              | **false**    | -                 |
|                    | If not provided, this is automatically filled by the OIDC action.                                                  |              |                   |

<!-- inputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- outputs:start -->

## Outputs

| **Output**       | **Description**                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **`repository`** | The reusable workflow repository that was checked out, in the format `owner/repo`.          |
| **`ref`**        | The Git ref (branch, tag, or SHA) of the reusable workflow repository that was checked out. |

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
