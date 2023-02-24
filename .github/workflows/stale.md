<!-- start title -->

# GitHub Reusable Workflow: Stale

<!-- end title -->
<!-- start description -->

Reusable workflow to manage stale issues and pull requests.
Mainly using [Stale Action](https://github.com/actions/stale), with some opinionated defaults.

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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/stale.yml@main

    # Optional customizations.
    with:
      # Comment on the staled issues.
      # See https://github.com/actions/stale#stale-issue-message
      # Default: "This issue is stale"
      stale-issue-message: ""

      # Comment on the staled PRs.
      # See https://github.com/actions/stale#stale-pr-message
      # Default: "This PR is stale"
      stale-pr-message: ""

      # Label to apply on staled issues.
      # See https://github.com/actions/stale#stale-issue-label
      # Default: "no-issue-activity"
      stale-issue-label: ""

      # Labels on issues exempted from stale.
      # See https://github.com/actions/stale#exempt-issue-labels
      # Default: "awaiting-approval,work-in-progress"
      exempt-issue-labels: ""

      # Label to apply on staled PRs.
      # See https://github.com/actions/stale#stale-pr-label
      # Default: "no-pr-activity"
      stale-pr-label: ""

      # Labels on PRs exempted from stale.
      # See https://github.com/actions/stale#exempt-pr-labels
      # Default: "awaiting-approval,work-in-progress"
      exempt-pr-labels: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                            | **Description**                                                                                | **Default**                                     | **Required** |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------ |
| **<code>stale-issue-message</code>** | Comment on the staled issues. See https://github.com/actions/stale#stale-issue-message         | <code>This issue is stale</code>                | **false**    |
| **<code>stale-pr-message</code>**    | Comment on the staled PRs. See https://github.com/actions/stale#stale-pr-message               | <code>This PR is stale</code>                   | **false**    |
| **<code>stale-issue-label</code>**   | Label to apply on staled issues. See https://github.com/actions/stale#stale-issue-label        | <code>no-issue-activity</code>                  | **false**    |
| **<code>exempt-issue-labels</code>** | Labels on issues exempted from stale. See https://github.com/actions/stale#exempt-issue-labels | <code>awaiting-approval,work-in-progress</code> | **false**    |
| **<code>stale-pr-label</code>**      | Label to apply on staled PRs. See https://github.com/actions/stale#stale-pr-label              | <code>no-pr-activity</code>                     | **false**    |
| **<code>exempt-pr-labels</code>**    | Labels on PRs exempted from stale. See https://github.com/actions/stale#exempt-pr-labels       | <code>awaiting-approval,work-in-progress</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
