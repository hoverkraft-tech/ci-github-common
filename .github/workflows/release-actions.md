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
      # Private Access Token for commiting changes and bypassing branch protection if any.
      private-access-token: ${{ secrets.GH_PAT }}
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                            | **Description**                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **<code>private-access-token</code>** | Private Access Token for commiting changes and bypassing branch protection if any. Needs following permissions: <ul><li>"Repository permissions" > "Contents" > "Read and write"</li></ul> |

<!-- end secrets -->
<!-- start inputs -->

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
