<!-- start title -->

# GitHub Reusable Workflow: Greetings

<!-- end title -->
<!-- start description -->

Workflow to greet new contributors.
Mainly using [First Interaction Action](https://github.com/actions/first-interaction), with some opinionated defaults.

- On issue creation, a comment is added to the issue.
- On first contribution, a comment is added to the pull request.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: Mark stale issues and pull requests

on:
  schedule:
    - cron: "30 1 * * *"

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/greetings.yml@0.3.2
    secrets:
      # Token for the repository. Can be passed in using "${{ secrets.GITHUB_TOKEN }}".
      # See https://github.com/actions/first-interaction#usage
      github-token: ${{ secrets.GITHUB_TOKEN }}

    # Optional customizations.
    with:
      # Comment to post on an individual's first issue.
      # See https://github.com/actions/first-interaction#usage
      # Default: "Hi, thank for reporting an issue, we will check it out very soon"
      issue-message: ""
      # Comment to post on an individual's first pull request.
      # See https://github.com/actions/first-interaction#usage
      # Default: "Hi, thank you for creating your PR, we will check it out very soon"
      pr-message: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **<code>github-token</code>** | Token for the repository. Can be passed in using "${{ secrets.GITHUB_TOKEN }}". See https://github.com/actions/first-interaction#usage |

<!-- end secrets -->
<!-- start inputs -->

| **Input**                      | **Description**                                                                                               | **Default**                                                                     | **Required** |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------ |
| **<code>issue-message</code>** | Comment to post on an individual's first issue. See https://github.com/actions/first-interaction#usage        | <code>Hi, thank for reporting an issue, we will check it out very soon</code>   | **false**    |
| **<code>issue-message</code>** | Comment to post on an individual's first pull request. See https://github.com/actions/first-interaction#usage | <code>Hi, thank you for creating your PR, we will check it out very soon</code> | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
