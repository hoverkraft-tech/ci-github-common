<!-- header:start -->

# GitHub Reusable Workflow: Build action distributions

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Build committed Node.js action distributions for allowed automation PRs.
Use this workflow from a pull_request caller with no secrets. Configure both
callers through inputs as shown in the [setup guide](../../docs/usage/action-distributions.md).
The generated Usage block lists inputs; execution requires the guide's event wrapper.

### Permissions

- **`contents`**: `read`
- **`pull-requests`**: `read`

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
name: Build action distributions
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  build-action-distributions:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/build-action-distributions.yml@d9dabed080a27cdf01428c11595524d606fa4123 # perf/475-p2-report-parser-bundle
    permissions:
      contents: read
      pull-requests: read
    with:
      # Newline-separated package directories relative to the repository root. Use . for a root package.
      # Default: `.`
      working-directories: .

      # Generated directory relative to each package. Only files inside it may be committed.
      # Default: `dist`
      output-directory: dist

      # Newline-separated files required in every generated directory. Empty accepts any nonempty output.
      # Default: `index.js
      # licenses.txt
      # `
      required-files: |
        index.js
        licenses.txt

      # JSON array of dependabot or renovate presets, or objects with login, numeric id and optional branch-prefix and commit-message-suffix.
      # Default: `["dependabot","renovate"]`
      pull-request-authors: '["dependabot","renovate"]'

      # Artifact name prefix. The run attempt is appended automatically. Must match in both callers.
      # Default: `action-distributions`
      artifact-name: action-distributions

      # Node.js version used for npm install and the build script.
      # Default: `24`
      node-version: "24"

      # npm script name to run after npm ci with dependency lifecycle scripts disabled.
      # Default: `build`
      build-script: build

      # Artifact retention in days, within the repository's artifact policy.
      # Default: `1`
      retention-days: 1
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                  | **Description**                                                                                                                       | **Required** | **Type**   | **Default**                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **`working-directories`**  | Newline-separated package directories relative to the repository root. Use . for a root package.                                      | **false**    | **string** | `.`                                                                                               |
| **`output-directory`**     | Generated directory relative to each package. Only files inside it may be committed.                                                  | **false**    | **string** | `dist`                                                                                            |
| **`required-files`**       | Newline-separated files required in every generated directory. Empty accepts any nonempty output.                                     | **false**    | **string** | <!-- textlint-disable --><pre lang="text">index.js&#13;licenses.txt</pre><!-- textlint-enable --> |
| **`pull-request-authors`** | JSON array of dependabot or renovate presets, or objects with login, numeric id and optional branch-prefix and commit-message-suffix. | **false**    | **string** | `["dependabot","renovate"]`                                                                       |
| **`artifact-name`**        | Artifact name prefix. The run attempt is appended automatically. Must match in both callers.                                          | **false**    | **string** | `action-distributions`                                                                            |
| **`node-version`**         | Node.js version used for npm install and the build script.                                                                            | **false**    | **string** | `24`                                                                                              |
| **`build-script`**         | npm script name to run after npm ci with dependency lifecycle scripts disabled.                                                       | **false**    | **string** | `build`                                                                                           |
| **`retention-days`**       | Artifact retention in days, within the repository's artifact policy.                                                                  | **false**    | **number** | `1`                                                                                               |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->
<!-- outputs:end -->
<!-- examples:start -->
<!-- examples:end -->
<!-- contributing:start -->
<!-- contributing:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->
<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
