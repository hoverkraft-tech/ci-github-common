<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Reusable Workflow: Greetings

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
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
name: Greetings

on:
  issues:
    types: [opened]
  pull_request_target:
    branches: [main]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  greetings:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/greetings.yml@0.13.0
    secrets:
      # Token for the repository.
      # See https://github.com/actions/first-interaction#usage
      # Default GITHUB_TOKEN
      github-token: ""

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

| **Secret**                    | **Description**                                                                                                                        | **Default**               | **Required** |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>** | Token for the repository. See [https://github.com/actions/first-interaction#usage](https://github.com/actions/first-interaction#usage) | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->
<!-- start inputs -->

| **Input**                      | **Description**                                                                                                                                                                                | **Default**                                                                     | **Required** |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------ |
| **<code>runs-on</code>**       | Json array of runner(s) to use. See [https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job](https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job) | <code>["ubuntu-latest"]</code>                                                  | **false**    |
| **<code>issue-message</code>** | Comment to post on an individual's first issue. See [https://github.com/actions/first-interaction#usage](https://github.com/actions/first-interaction#usage)                                   | <code>Hi, thank for reporting an issue, we will check it out very soon</code>   | **false**    |
| **<code>issue-message</code>** | Comment to post on an individual's first pull request. See [https://github.com/actions/first-interaction#usage](https://github.com/actions/first-interaction#usage)                            | <code>Hi, thank you for creating your PR, we will check it out very soon</code> | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
