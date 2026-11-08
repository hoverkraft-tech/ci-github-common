<!-- header:start -->

# GitHub Reusable Workflow: Commit action distributions

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Commit generated distributions from the matching successful PR build.
Use this workflow only from the trusted default-branch workflow_run caller in the
[setup guide](../../docs/usage/action-distributions.md). Its inputs define the write
allowlist. The writer never checks out or executes PR code. The generated Usage
block lists inputs; execution requires the guide's workflow_run event wrapper.

### Permissions

- **`actions`**: `read`
- **`contents`**: `read`
- **`pull-requests`**: `read`

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
name: Commit action distributions
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  commit-action-distributions:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/commit-action-distributions.yml@283b16c9f0d0a7c92875d0660be31d12dc923651 # perf/475-p2-report-parser-bundle
    permissions:
      actions: read
      contents: read
      pull-requests: read
    secrets:
      # GitHub App private key. Pass only from the trusted workflow_run caller.
      # This input is required.
      github-app-key: ""
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

      # JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.
      # Default: `["dependabot","renovate"]`
      pull-request-authors: '["dependabot","renovate"]'

      # Artifact name prefix. The run attempt is appended automatically. Must match in both callers.
      # Default: `action-distributions`
      artifact-name: action-distributions

      # Repository-relative path of the pull_request caller workflow that produced the artifact.
      # This input is required.
      build-workflow: ""

      # Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.
      # Default: `build: regenerate action distributions`
      commit-message: "build: regenerate action distributions"

      # Client ID of the GitHub App installed on the caller repository with contents write and actions and pull requests read access.
      # This input is required.
      github-app-client-id: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                  | **Description**                                                                                                                               | **Required** | **Type**   | **Default**                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **`working-directories`**  | Newline-separated package directories relative to the repository root. Use . for a root package.                                              | **false**    | **string** | `.`                                                                                               |
| **`output-directory`**     | Generated directory relative to each package. Only files inside it may be committed.                                                          | **false**    | **string** | `dist`                                                                                            |
| **`required-files`**       | Newline-separated files required in every generated directory. Empty accepts any nonempty output.                                             | **false**    | **string** | <!-- textlint-disable --><pre lang="text">index.js&#13;licenses.txt</pre><!-- textlint-enable --> |
| **`pull-request-authors`** | JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix. | **false**    | **string** | `["dependabot","renovate"]`                                                                       |
| **`artifact-name`**        | Artifact name prefix. The run attempt is appended automatically. Must match in both callers.                                                  | **false**    | **string** | `action-distributions`                                                                            |
| **`build-workflow`**       | Repository-relative path of the pull_request caller workflow that produced the artifact.                                                      | **true**     | **string** | -                                                                                                 |
| **`commit-message`**       | Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.                                             | **false**    | **string** | `build: regenerate action distributions`                                                          |
| **`github-app-client-id`** | Client ID of the GitHub App installed on the caller repository with contents write and actions and pull requests read access.                 | **true**     | **string** | -                                                                                                 |

<!-- inputs:end -->
<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                                         | **Required** |
| -------------------- | ----------------------------------------------------------------------- | ------------ |
| **`github-app-key`** | GitHub App private key. Pass only from the trusted workflow_run caller. | **true**     |

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
