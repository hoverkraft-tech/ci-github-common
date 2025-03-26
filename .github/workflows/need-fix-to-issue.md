<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Reusable Workflow: Need fix to Issue

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Reusable workflow to convert comments requiring fixes (todo, FIXME) to issues.
Mainly using [Todo to Issue Action](https://github.com/alstr/todo-to-issue-action), with some opinionated defaults.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
name: Need fix to Issue

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      #checkov:skip=CKV_GHA_7: required
      manual-commit-ref:
        description: "The SHA of the commit to get the diff for."
        required: true
      manual-base-ref:
        description: "By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here."
        required: false

permissions:
  contents: read
  issues: write

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/need-fix-to-issue.yml@0.20.0
    with:
      manual-commit-ref: ${{ inputs.manual-commit-ref }}
      manual-base-ref: ${{ inputs.manual-base-ref }}
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                          | **Description**                                                                                                                    | **Default**                   | **Type** | **Required** |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------------ |
| **<code>runs-on</code>**           | Json array of runner(s) to use. See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.                 | <code>["ubuntu-latest"]<code> | `string` | **false**    |
| **<code>manual-commit-ref</code>** | The SHA of the commit to get the diff for.                                                                                         | <code></code>                 | `string` | **false**    |
| **<code>manual-base-ref</code>**   | By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here for. | <code></code>                 | `string` | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
