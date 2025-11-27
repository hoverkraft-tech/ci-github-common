<!-- header:start -->

# GitHub Reusable Workflow: Linter

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Linter" />
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

Reusable workflow that performs linting on the codebase.
Executes:

- [Super-Linter](https://github.com/super-linter/super-linter), with some opinionated defaults.
- [CodeQL](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql) to analyze the code.
- [Ratchet](https://github.com/sethvargo/ratchet) to check that GitHub Action versions are pinned.

### Permissions

- **`actions`**: `read`
- **`contents`**: `read`
- **`security-events`**: `write`
- **`statuses`**: `write`

<!-- overview:end -->

### GitHub Actions Pinning

**Tips:** To ensure that all GitHub Actions used in your workflows are pinned to a specific version,
you can use the [Ratchet](https://github.com/sethvargo/ratchet) tool integrated into this workflow.

```sh
docker run -it --rm -v "${PWD}:${PWD}" -w "${PWD}" -u $(id -u):$(id -g) \
  --env GITHUB_TOKEN=$(gh auth token) \
  ghcr.io/sethvargo/ratchet:latest \
  lint ".github/workflows/file-to-lint.yml"
```

<!-- usage:start -->

## Usage

```yaml
name: Linter
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  linter:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter.yml@a55670b58d3e064526201acde6c720ede638420c # 0.31.0
    permissions: {}
    secrets:
      # Token for marking the status of linter run in the Checks section.
      # See https://github.com/super-linter/super-linter#how-to-use.
      # Default GITHUB_TOKEN.
      github-token: ""
    with:
      # JSON array of runner(s) to use.
      # See https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job.
      #
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # Environment variables in multilines format "key=value" to pass to the linter.
      # See https://github.com/super-linter/super-linter.
      linter-env: ""

      # JSON array of languages to analyze with CodeQL.
      # See https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/.
      # Leave empty to disable the check.
      #
      # Default: `["actions"]`
      codeql-languages: '["actions"]'

      # List of files or directories where GitHub Actions and workflows are located.
      # Supports glob patterns.
      # Leave empty to disable the check.
      #
      # Default: `./action.yml
      # ./.github/workflows/**/*.yml
      # ./actions/**/*.yml
      # `
      action-files: |
        ./action.yml
        ./.github/workflows/**/*.yml
        ./actions/**/*.yml

      # Run checks on all files, not just the changed ones.
      # Default: `${{ github.event_name != 'pull_request' }}`
      lint-all: false
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**              | **Description**                                                                           | **Required** | **Type**    | **Default**                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`runs-on`**          | JSON array of runner(s) to use.                                                           | **false**    | **string**  | `["ubuntu-latest"]`                                                                                                                         |
|                        | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.        |              |             |                                                                                                                                             |
| **`linter-env`**       | Environment variables in multilines format "key=value" to pass to the linter.             | **false**    | **string**  | -                                                                                                                                           |
|                        | See <https://github.com/super-linter/super-linter>.                                       |              |             |                                                                                                                                             |
| **`codeql-languages`** | JSON array of languages to analyze with CodeQL.                                           | **false**    | **string**  | `["actions"]`                                                                                                                               |
|                        | See <https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/>. |              |             |                                                                                                                                             |
|                        | Leave empty to disable the check.                                                         |              |             |                                                                                                                                             |
| **`action-files`**     | List of files or directories where GitHub Actions and workflows are located.              | **false**    | **string**  | <!-- textlint-disable --><pre>./action.yml&#13;./.github/workflows/\*\*/\*.yml&#13;./actions/\*\*/\*.yml&#13;</pre><!-- textlint-enable --> |
|                        | Supports glob patterns.                                                                   |              |             |                                                                                                                                             |
|                        | Leave empty to disable the check.                                                         |              |             |                                                                                                                                             |
| **`lint-all`**         | Run checks on all files, not just the changed ones.                                       | **false**    | **boolean** | `$\{\{ github.event_name != 'pull_request' }}`                                                                                              |

<!-- inputs:end -->

<!-- secrets:start -->

## Secrets

| **Secret**         | **Description**                                                   | **Required** |
| ------------------ | ----------------------------------------------------------------- | ------------ |
| **`github-token`** | Token for marking the status of linter run in the Checks section. | **false**    |
|                    | See <https://github.com/super-linter/super-linter#how-to-use>.    |              |
|                    | Default GITHUB_TOKEN.                                             |              |

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
