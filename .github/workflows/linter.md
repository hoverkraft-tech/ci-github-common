<!-- header:start -->

# GitHub Reusable Workflow: Linter

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Linter" />
</div>

---

<!-- header:end -->

<!-- jscpd:ignore-start -->

<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- jscpd:ignore-end -->

<!-- overview:start -->

## Overview

Reusable workflow that performs linting on the codebase.
Executes:

- [Hoverkraft Super-Linter](https://github.com/hoverkraft-tech/docker-base-images/tree/main/images/super-linter), shared with local linting.
- [CodeQL](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql) to analyze the code.
- [Ratchet](https://github.com/sethvargo/ratchet) to check that GitHub Action versions are pinned.

Commitlint is disabled by default for scheduled and manual runs, and for pushes
with no commits (such as creating a tag on an existing commit).
Explicit `linter-env` validator settings take precedence.

For consolidated reporting, call this workflow from a job named `lint`, set
`comment: false`, and include that job in the CI reports workflow dependencies.
The native Super-Linter summary is uploaded even after lint failures. CodeQL
findings remain in code scanning; Ratchet diagnostics remain in workflow logs.

### Permissions

- **`actions`**: `read`
- **`contents`**: `read`
- **`issues`**: `write`
- **`packages`**: `read`
- **`pull-requests`**: `write`
- **`security-events`**: `write`
- **`statuses`**: `write`

<!-- overview:end -->

### Shared linting image

Super-Linter runs in the [Hoverkraft image](https://github.com/hoverkraft-tech/docker-base-images/tree/main/images/super-linter).
The image owns toolchain selection, Kubernetes schema defaults, and fallback
commitlint rules. Use the same image release for local linting to share
these defaults and the bundled linter versions.

The local Dockerfile and workflow pin the same image release and SHA256 digest.
Update both references together when updating the image: Dependabot updates Dockerfiles but
[does not update `docker://` workflow references](https://github.com/dependabot/dependabot-core/issues/8362).

Values in `linter-env` override the toolchain inputs and image defaults. An empty
`VALIDATE_JAVASCRIPT_TOOLCHAIN` or `VALIDATE_PYTHON_TOOLCHAIN` value disables the
corresponding automatic toolchain exclusions. `VALIDATE_GIT_COMMITLINT=false`
disables commitlint. With toolchain selectors enabled, explicit `true` keeps it
enabled without restricting the other validators. Set both selectors to empty
strings to use Super-Linter's native `VALIDATE_*=true` allowlist, including
commitlint. Do not mix `true` and `false` validator flags in that mode.

CI uses Git change detection according to `lint-all` and publishes GitHub
summaries. Scheduled (`schedule`) and manual (`workflow_dispatch`) runs disable
commitlint by default because these events do not provide a commit range.
Explicit `linter-env` validator settings take precedence.
Local runs use filesystem discovery by default. The workflow also
installs project dependencies when `package.json` declares Prettier plugins;
install those dependencies before running the image locally.

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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter.yml@5fbb531db839a26ebcc35c4946be279f945f7633 # 1.0.0
    permissions:
      actions: read
      contents: read
      issues: write
      packages: read
      pull-requests: write
      security-events: write
      statuses: write
    secrets:
      # Token for marking the status of linter run in the Checks section.
      # See https://github.com/super-linter/super-linter#how-to-use.
      # Default GITHUB_TOKEN.
      github-token: ""
    with:
      # Publish the Super-Linter PR comment. Disable when using the CI reports workflow.
      # Default: `true`
      comment: true

      # JSON array of runner(s) to use.
      # See https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job.
      #
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # Environment variables in multilines format "key=value" to pass to the linter.
      # See https://github.com/super-linter/super-linter.
      linter-env: ""

      # Lint toolchain to use for Super-Linter JavaScript and frontend validators.
      # Supported values: biome, eslint-prettier.
      #
      # Default: `biome`
      javascript-linter-toolchain: biome

      # Lint toolchain to use for Super-Linter Python format validators.
      # Supported values: black, ruff-format.
      #
      # Default: `ruff-format`
      python-linter-toolchain: ruff-format

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

| **Input**                         | **Description**                                                                           | **Required** | **Type**    | **Default**                                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`comment`**                     | Publish the Super-Linter PR comment. Disable when using the CI reports workflow.          | **false**    | **boolean** | `true`                                                                                                                                             |
| **`runs-on`**                     | JSON array of runner(s) to use.                                                           | **false**    | **string**  | `["ubuntu-latest"]`                                                                                                                                |
|                                   | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.        |              |             |                                                                                                                                                    |
| **`linter-env`**                  | Environment variables in multilines format "key=value" to pass to the linter.             | **false**    | **string**  | -                                                                                                                                                  |
|                                   | See <https://github.com/super-linter/super-linter>.                                       |              |             |                                                                                                                                                    |
| **`javascript-linter-toolchain`** | Lint toolchain to use for Super-Linter JavaScript and frontend validators.                | **false**    | **string**  | `biome`                                                                                                                                            |
|                                   | Supported values: biome, eslint-prettier.                                                 |              |             |                                                                                                                                                    |
| **`python-linter-toolchain`**     | Lint toolchain to use for Super-Linter Python format validators.                          | **false**    | **string**  | `ruff-format`                                                                                                                                      |
|                                   | Supported values: black, ruff-format.                                                     |              |             |                                                                                                                                                    |
| **`codeql-languages`**            | JSON array of languages to analyze with CodeQL.                                           | **false**    | **string**  | `["actions"]`                                                                                                                                      |
|                                   | See <https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/>. |              |             |                                                                                                                                                    |
|                                   | Leave empty to disable the check.                                                         |              |             |                                                                                                                                                    |
| **`action-files`**                | List of files or directories where GitHub Actions and workflows are located.              | **false**    | **string**  | <!-- textlint-disable --><pre lang="text">./action.yml&#13;./.github/workflows/\*\*/\*.yml&#13;./actions/\*\*/\*.yml</pre><!-- textlint-enable --> |
|                                   | Supports glob patterns.                                                                   |              |             |                                                                                                                                                    |
|                                   | Leave empty to disable the check.                                                         |              |             |                                                                                                                                                    |
| **`lint-all`**                    | Run checks on all files, not just the changed ones.                                       | **false**    | **boolean** | `${{ github.event_name != 'pull_request' }}`                                                                                                       |

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

<!-- jscpd:ignore-start -->

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
<!-- jscpd:ignore-end -->
