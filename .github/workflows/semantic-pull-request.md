<!-- start title -->

# GitHub Reusable Workflow: Semantic pull request

<!-- end title -->
<!-- start description -->

Workflow to ensure "Squash and merge" Pull Request strategy provides a valid commit message.
Check that the title follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
Mainly using [action-semantic-pull-request](https://github.com/amannn/action-semantic-pull-request#installation), with some opinionated defaults.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: "Pull Request - Semantic Lint"

on:
  pull_request_target:
    types:
      - opened
      - edited
      - synchronize

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/semantic-pull-request.yml@0.5.0
    secrets:
      # Token for the repository.
      # See https://github.com/amannn/action-semantic-pull-request#installation
      # Default GITHUB_TOKEN
      github-token: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                                         |     | **Default**               | **Required** |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------- | ------------ |
| **<code>github-token</code>** | Token for the repository. See [https://github.com/amannn/action-semantic-pull-request#installation](https://github.com/actions/first-interaction#usage) |     | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->
<!-- start inputs -->

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
