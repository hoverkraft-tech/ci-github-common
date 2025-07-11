<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Reusable Workflow: Linter

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Reusable workflow that performs linting on the codebase.
Executes:

- [Super-Linter](https://github.com/super-linter/super-linter), with some opinionated defaults.
- [CodeQL](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql) to analyze the code.
- [Ratchet](https://github.com/sethvargo/ratchet) to check that GitHub Action versions are pinned.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
name: "Linter"

on:
  push:
    branches: [main]
    tags: ["*"]

  pull_request:
    branches: [main]

permissions:
  contents: read
  statuses: write
  # If using CodeQL
  actions: read
  security-events: write

jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/linter.yml@0.23.1
    with:
      # Json array of runner(s) to use.
      # See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.
      runs-on: '["ubuntu-latest"]'

      # Environment variables in multilines format "key=value" to pass to the linter.
      # See <https://github.com/super-linter/super-linter>.
      linter-env: ""

      # JSON array of languages to analyze with CodeQL.
      # See <https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/>.
      # Leave empty to disable the check.
      codeql-languages: '["actions"]'

      # List of files or directories where GitHub Actions and workflows are located.
      # Supports glob patterns.
      # Leave empty to disable the check.
      action-files: |
        ./action.yml
        ./.github/workflows/**/*.yml
        ./actions/**/*.yml

      # Run checks on all files, not just the changed ones.
      lint-all: ${{ github.event_name != 'pull_request' }}

    secrets:
      # Token for marking the status of linter run in the Checks section.
      # See https://github.com/super-linter/super-linter#how-to-use
      # Default GITHUB_TOKEN.
      github-token: ""
```

<!-- end usage -->

## Secrets

<!-- start secrets -->

| **Secret**                    | **Description**                                                                                                                  | **Default**               | **Required** |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>** | Token for marking the status of linter run in the Checks section. See <https://github.com/super-linter/super-linter#how-to-use>. | <code>GITHUB_TOKEN</code> | **false**    |

<!-- end secrets -->

## Inputs

<!-- start inputs -->

| **Input**                         | **Description**                                                                                                                                                             | **Default**                                                                       | **Type**  | **Required** |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------- | ------------ |
| **<code>runs-on</code>**          | Json array of runner(s) to use. See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>.                                                          | <code>["ubuntu-latest"]<code>                                                     | `string`  | **false**    |
| **<code>linter-env</code>**       | Environment variables in multilines format "key=value" to pass to the linter. See <https://github.com/super-linter/super-linter>.                                           | <code>.github/workflows\nactions</code>                                           | `string`  | **false**    |
| **<code>codeql-languages</code>** | JSON array of languages to analyze with CodeQL. See <https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/>. Leave empty to disable the check. | <code>["actions"]</code>                                                          | `string`  | **false**    |
| **<code>action-files</code>**     | List of files or directories where GitHub Actions and workflows are located. Supports glob patterns. Leave empty to disable the check.                                      | <code>./action.yml\n./.github/workflows/\*\*/\*.yml\n./actions/\*\*/\*.yml</code> | `string`  | **false**    |
| **<code>lint-all</code>**         | Run linter on all files, not just the changed ones.                                                                                                                         | <code>github.event_name != 'pull_request'</code>                                  | `boolean` | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
