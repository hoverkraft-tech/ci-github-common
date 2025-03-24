<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Reusable Workflow: Linter - Actions

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Reusable workflow that performs GitHub Actions linting on the codebase.
Applys [GitHub security recommendations](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).
Uses:

- [Common linter](./linter.md) with some opinionated defaults.
- [CodeQL](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql) to analyze the code.
- [Ratchet](https://github.com/sethvargo/ratchet) to check that all versions are pinned.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: "Linter - Actions"

on:
  push:
    branches: [main]
    tags: ["*"]

  pull_request:
    branches: [main]

  schedule:
    - cron: "25 8 * * 1"

permissions:
  contents: read
  statuses: write
  security-events: write

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter-actions.yml@0.14.0
    secrets:
      # Token for marking the status of linter run in the Checks section.
      # See [linter](./linter.md).
      github-token: ""
```

<!-- end usage -->

## Secrets

<!-- start secrets -->

| **Secret**                    | **Description**                                                                              | **Default**               | **Required** |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>** | Token for marking the status of linter run in the Checks section. See [linter](./linter.md). | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->

## Inputs

<!-- start inputs -->

| **Input**                     | **Description**                                                                                                    | **Default**                                                                       | **Type**  | **Required** |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | --------- | ------------ |
| **<code>runs-on</code>**      | Json array of runner(s) to use. See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>. | <code>["ubuntu-latest"]<code>                                                     | `string`  | **false**    |
| **<code>lint-all</code>**     | Run linter on all files, not just the changed ones.                                                                | <code>github.event_name != 'pull_request'</code>                                  | `boolean` | **false**    |
| **<code>action-files</code>** | List of files or directories where GitHub Actions are defined. Supports glob patterns.                             | <code>./action.yml\n./.github/workflows/\*\*/\*.yml\n./actions/\*\*/\*.yml</code> | `string`  | **false**    |
| **<code>linter-env</code>**   | Environment variables in multilines format "key=value" to pass to the linter. See [linter](./linter.md).           | <code></code>                                                                     | `string`  | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
