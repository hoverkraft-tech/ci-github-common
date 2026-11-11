<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItcGFja2FnZSIgY29sb3I9ImJsdWUiPjxsaW5lIHgxPSIxNi41IiB5MT0iOS40IiB4Mj0iNy41IiB5Mj0iNC4yMSI+PC9saW5lPjxwYXRoIGQ9Ik0yMSAxNlY4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNnoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIzLjI3IDYuOTYgMTIgMTIuMDEgMjAuNzMgNi45NiI+PC9wb2x5bGluZT48bGluZSB4MT0iMTIiIHkxPSIyMi4wOCIgeDI9IjEyIiB5Mj0iMTIiPjwvbGluZT48L3N2Zz4=) GitHub Action: Action distributions

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Action distributions" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-action--distributions-blue?logo=github-actions)](https://github.com/marketplace/actions/action-distributions)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Discover, build or commit generated Node.js action distributions using validated PR policy.
The [reusable workflow](../../.github/workflows/action-distributions.md) handles
runner setup, artifacts, App tokens and event routing; use it for repository setup.

This composite action owns the build and publication logic. Its
operations are `discover`, `prepare-build`, `build`, `prepare-commit` and `commit`. Preparation
validates the originating event and selects affected packages before execution.
Build operations require a read-only PR job. Commit operations require a trusted
default-branch workflow_run job and never execute or check out PR code.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/action-distributions@0864018583d79f7e535f572005baa35f2e864849 # 4.1.0
  with:
    # Operation to execute (discover, prepare-build, build, prepare-commit or commit).
    # This input is required.
    operation: ""

    # Newline-separated package directories or glob patterns (`*`, `**`, `?`). Empty discovers root and `actions/**` packages declaring build and check:dist scripts.
    working-directories: ""

    # Newline-separated generated directories or glob patterns (`*`, `**`, `?`) relative to each package. Patterns select committed directories from the trusted base revision; matches must be non-overlapping.
    # Default: `dist`
    output-directory: dist

    # Newline-separated files required in every generated directory. Empty accepts any nonempty output.
    # Default: `index.js
    # licenses.txt
    # `
    required-files: |
      index.js
      licenses.txt

    # JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.
    # Default: `["dependabot","renovate"]`
    pull-request-authors: '["dependabot","renovate"]'

    # Artifact name prefix. The run attempt is appended automatically. Use the same value for build and commit.
    # Default: `action-distributions`
    artifact-name: action-distributions

    # Package script name to run after a locked dependency installation.
    # Default: `build`
    build-script: build

    # Locked install command from ci-github-nodejs/get-package-manager. The executable must already be installed; arguments are passed without a shell.
    # Default: `npm ci --no-audit --no-fund`
    install-command: npm ci --no-audit --no-fund

    # Script command from ci-github-nodejs/get-package-manager, used for every selected package without a shell.
    # Default: `npm run`
    run-script-command: npm run

    # Disable install lifecycle scripts. Set false only in the read-only builder when the package requires approved hooks.
    # Default: `true`
    ignore-scripts: "true"

    # Maximum serialized artifact size in MiB (integer from 1 to 128). Use the same limit for build and writer.
    # Default: `20`
    max-artifact-size: "20"

    # Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.
    # Default: `build: regenerate action distributions`
    commit-message: "build: regenerate action distributions"

    # Absolute path of the exact PR head checkout, required for build.
    # Default: `${{ github.workspace }}`
    workspace: ${{ github.workspace }}

    # Absolute JSON artifact path to write for build or read for commit.
    # Default: `${{ runner.temp }}/action-distributions/distributions.json`
    artifact-path: ${{ runner.temp }}/action-distributions/distributions.json

    # GitHub token for API calls. Use a read-only token for building and an App token only for committing.
    # Default: `${{ github.token }}`
    github-token: ${{ github.token }}
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**                  | **Description**                                                                                                                                                                                            | **Required** | **Default**                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| **`operation`**            | Operation to execute (discover, prepare-build, build, prepare-commit or commit).                                                                                                                           | **true**     | -                                                                                                 |
| **`working-directories`**  | Newline-separated package directories or glob patterns (`*`, `**`, `?`). Empty discovers root and `actions/**` packages declaring build and check:dist scripts.                                            | **false**    | -                                                                                                 |
| **`output-directory`**     | Newline-separated generated directories or glob patterns (`*`, `**`, `?`) relative to each package. Patterns select committed directories from the trusted base revision; matches must be non-overlapping. | **false**    | `dist`                                                                                            |
| **`required-files`**       | Newline-separated files required in every generated directory. Empty accepts any nonempty output.                                                                                                          | **false**    | <!-- textlint-disable --><pre lang="text">index.js&#13;licenses.txt</pre><!-- textlint-enable --> |
| **`pull-request-authors`** | JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.                                                              | **false**    | `["dependabot","renovate"]`                                                                       |
| **`artifact-name`**        | Artifact name prefix. The run attempt is appended automatically. Use the same value for build and commit.                                                                                                  | **false**    | `action-distributions`                                                                            |
| **`build-script`**         | Package script name to run after a locked dependency installation.                                                                                                                                         | **false**    | `build`                                                                                           |
| **`install-command`**      | Locked install command from ci-github-nodejs/get-package-manager. The executable must already be installed; arguments are passed without a shell.                                                          | **false**    | `npm ci --no-audit --no-fund`                                                                     |
| **`run-script-command`**   | Script command from ci-github-nodejs/get-package-manager, used for every selected package without a shell.                                                                                                 | **false**    | `npm run`                                                                                         |
| **`ignore-scripts`**       | Disable install lifecycle scripts. Set false only in the read-only builder when the package requires approved hooks.                                                                                       | **false**    | `true`                                                                                            |
| **`max-artifact-size`**    | Maximum serialized artifact size in MiB (integer from 1 to 128). Use the same limit for build and writer.                                                                                                  | **false**    | `20`                                                                                              |
| **`commit-message`**       | Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.                                                                                                          | **false**    | `build: regenerate action distributions`                                                          |
| **`workspace`**            | Absolute path of the exact PR head checkout, required for build.                                                                                                                                           | **false**    | `${{ github.workspace }}`                                                                         |
| **`artifact-path`**        | Absolute JSON artifact path to write for build or read for commit.                                                                                                                                         | **false**    | `${{ runner.temp }}/action-distributions/distributions.json`                                      |
| **`github-token`**         | GitHub token for API calls. Use a read-only token for building and an App token only for committing.                                                                                                       | **false**    | `${{ github.token }}`                                                                             |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**                | **Description**                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **`working-directories`** | JSON array of package directories selected by discover or affected packages selected by prepare-build for an eligible PR. |
| **`head-sha`**            | Eligible current PR head selected by prepare-build; empty when skipped.                                                   |
| **`built`**               | Whether build produced a validated distribution artifact.                                                                 |
| **`artifact-id`**         | Validated artifact selected by prepare-commit; empty when skipped.                                                        |

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

Copyright © 2026 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
