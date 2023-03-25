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
      # GitHub token for creating and merging pull request.
      # See https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/create-and-merge-pull-request
      # Default GITHUB_TOKEN
      github-token: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                                                                                                                                                    | **Default**               | **Required** |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------ |
| **<code>github-token</code>** | GitHub token for creating and merging pull request. See [https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/create-and-merge-pull-request](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/create-and-merge-pull-request) | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->
<!-- start inputs -->

| **Input**                   | **Description**                                          | **Default**        | **Required** |
| --------------------------- | -------------------------------------------------------- | ------------------ | ------------ |
| **<code>update-all</code>** | Update all actions and workflows, regardless of changes. | <code>false</code> | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
