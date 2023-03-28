<!-- start title -->

# GitHub Reusable Workflow: Release Actions

<!-- end title -->
<!-- start description -->

Reusable workflow that performs actions and workflows release.

- Generates README for changed actions and workflows (documentation, versioning, etc.)
- Commits and pushes the changes to the main branch

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: "Release Actions"

on:
  push:
    branches: [main]
    tags: ["*"]

jobs:
  release:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/release-actions.yml@0.3.4
    with:
      # Update all actions and workflows, regardless of changes.
      update-all: false

      # GitHub App ID to generate GitHub token in place of private-access-token.
      # See https://github.com/tibdex/github-app-token
      github-app-id: ""

    secrets:
      # GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write, workflows: write).
      # See [actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request)
      github-token: ""

      # GitHub App private key to generate GitHub token in place of github-token.
      # See https://github.com/tibdex/github-app-token
      github-app-key: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                      | **Description**                                                                                                                                                                                                             | **Default**               | **Required** |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>**   | GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write, workflows: write). See [../../actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request) | <code>GITHUB_TOKEN</code> | **false**    |
| **<code>github-app-key</code>** | GitHub App private key to generate GitHub token in place of github-token. See [https://github.com/tibdex/github-app-token](https://github.com/tibdex/github-app-token)                                                      | <code></code>             | **false**    |

<!-- end secrets -->
<!-- start inputs -->

| **Input**                      | **Description**                                                                                                                                                       | **Default**        | **Required** |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------ |
| **<code>update-all</code>**    | Update all actions and workflows, regardless of changes.                                                                                                              | <code>false</code> | **false**    |
| **<code>github-app-id</code>** | GitHub App ID to generate GitHub token in place of private-access-token. See [https://github.com/tibdex/github-app-token](https://github.com/tibdex/github-app-token) | <code></code>      | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
