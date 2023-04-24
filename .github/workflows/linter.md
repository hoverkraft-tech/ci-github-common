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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter.yml@0.4.4
    secrets:
      # Token for marking the status of linter run in the Checks section.
      # See https://github.com/github/super-linter#how-to-use
      # Default GITHUB_TOKEN
      github-token: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                                                              | **Default**               | **Required** |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>** | Token for marking the status of linter run in the Checks section. See [https://github.com/github/super-linter#how-to-use](https://github.com/github/super-linter#how-to-use) | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->
<!-- start inputs -->

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
