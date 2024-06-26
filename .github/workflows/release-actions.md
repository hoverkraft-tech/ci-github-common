<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Reusable Workflow: Release Actions

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Reusable workflow that performs actions and workflows release.

- Generates README for changed actions and workflows (documentation, versioning, etc.)
- Commits and pushes the changes to the main branch

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

# Usage

<!-- start usage -->

```yaml
name: "Release Actions"

on:
  push:
    branches: [main]
    tags: ["*"]

permissions:
  contents: write
  # FIXME: This is a workaround for having workflow ref. See https://github.com/orgs/community/discussions/38659
  id-token: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  release:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/release-actions.yml@0.14.0
    with:
      # Update all actions and workflows, regardless of changes.
      update-all: false

      # GitHub App ID to generate GitHub token in place of private-access-token.
      # See https://github.com/actions/create-github-app-token.
      github-app-id: ""

    secrets:
      # GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write, workflows: write).
      # See [actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request)
      github-token: ""

      # GitHub App private key to generate GitHub token in place of github-token.
      # See https://github.com/actions/create-github-app-token.
      github-app-key: ""
```

<!-- end usage -->

## Permissions

<!-- start permissions -->

This workflow requires the following permissions:

- `contents: read`: To read the contents of the repository
- `id-token: write`: <!-- FIXME --> This is a workaround for having workflow ref. See <https://github.com/orgs/community/discussions/38659>.

<!-- end permissions -->

## Secrets

<!-- start secrets -->

| **Secret**                      | **Description**                                                                                                                                                                                                             | **Default**               | **Required** |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>**   | GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write, workflows: write). See [../../actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request) | <code>GITHUB_TOKEN</code> | **false**    |
| **<code>github-app-key</code>** | GitHub App private key to generate GitHub token in place of github-token. See <https://github.com/actions/create-github-app-token>.                                                                                         | <code></code>             | **false**    |

<!-- end secrets -->

## Inputs

<!-- start inputs -->

| **Input**                      | **Description**                                                                                                                    | **Default**                    | **Required** |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------ |
| **<code>runs-on</code>**       | Json array of runner(s) to use. See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.                 | <code>["ubuntu-latest"]</code> | **false**    |
| **<code>update-all</code>**    | Update all actions and workflows, regardless of changes.                                                                           | <code>false</code>             | **false**    |
| **<code>github-app-id</code>** | GitHub App ID to generate GitHub token in place of private-access-token. See <https://github.com/actions/create-github-app-token>. | <code></code>                  | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
