<!-- header:start -->

# GitHub Reusable Workflow: Need fix to Issue

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Need fix to Issue" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

Reusable workflow to convert comments requiring fixes (todo, FIXME) to issues.
Mainly using [Todo to Issue Action](https://github.com/alstr/todo-to-issue-action), with some opinionated defaults.

### Permissions

- **`contents`**: `read`
- **`issues`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

```yaml
name: Need fix to Issue
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  need-fix-to-issue:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/need-fix-to-issue.yml@666b7b6eb000db3e8614647871fa60c9f1eb7179 # 0.31.4
    permissions: {}
    with:
      # JSON array of runner(s) to use.
      # See https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job.
      #
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # The SHA of the commit to get the diff for.
      manual-commit-ref: ""

      # By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here.
      manual-base-ref: ""
```

<!-- usage:end -->

**Tips:**

It is recommanded to add this trigger for this workflow:

```yaml
workflow_dispatch:
  inputs:
    #checkov:skip=CKV_GHA_7: required
    manual-commit-ref:
      description: "The SHA of the commit to get the diff for."
      required: true
    manual-base-ref:
      description: "By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here."
      required: false
```

<!-- inputs:start -->

## Inputs

### Workflow Dispatch Inputs

| **Input**               | **Description**                                                                                                                | **Required** | **Type**   | **Default** |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---------- | ----------- |
| **`manual-commit-ref`** | The SHA of the commit to get the diff for.                                                                                     | **true**     | **string** | -           |
| **`manual-base-ref`**   | By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here. | **false**    | **string** | -           |

### Workflow Call Inputs

| **Input**               | **Description**                                                                                                                | **Required** | **Type**   | **Default**         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---------- | ------------------- |
| **`runs-on`**           | JSON array of runner(s) to use.                                                                                                | **false**    | **string** | `["ubuntu-latest"]` |
|                         | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.                                             |              |            |                     |
| **`manual-commit-ref`** | The SHA of the commit to get the diff for.                                                                                     | **false**    | **string** | -                   |
| **`manual-base-ref`**   | By default, the commit entered above is compared to the one directly before it; to go back further, enter an earlier SHA here. | **false**    | **string** | -                   |

<!-- inputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- outputs:start -->
<!-- outputs:end -->

<!-- examples:start -->
<!-- examples:end -->

<!--
// jscpd:ignore-start
-->

<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->

<!-- security:start -->
<!-- security:end -->

<!-- license:start -->

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2025 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->

<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!--
// jscpd:ignore-end
-->
