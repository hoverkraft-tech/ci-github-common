<!-- start title -->

# GitHub Reusable Workflow: Linter

<!-- end title -->
<!-- start description -->

Reusable workflow that performs linting on the code base.
Mainly using [Super-Linter](https://github.com/github/super-linter), with some opinionated defaults.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: "Linter"

on:
  push:
    branches: [main]
    tags: ["*"]

  pull_request:
    branches: [main]

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter.yml@0.3.4
    secrets:
      # Token for marking the status of linter run in the Checks section. Can be passed in using "${{ secrets.GITHUB_TOKEN }}".
      # See https://github.com/github/super-linter#how-to-use
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **<code>github-token</code>** | Token for marking the status of linter run in the Checks section. Can be passed in using "${{ secrets.GITHUB_TOKEN }}". See [https://github.com/github/super-linter#how-to-use](https://github.com/github/super-linter#how-to-use) |

<!-- end secrets -->
<!-- start inputs -->

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
