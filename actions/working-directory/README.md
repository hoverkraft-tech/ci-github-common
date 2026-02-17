<!-- header:start -->

# GitHub Action: Resolve working directory

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Resolve working directory" />
</div>

---

<!-- header:end -->

## Overview

Action to resolve and validate a working directory path.

## Usage

```yaml
- id: resolve-working-directory
  uses: hoverkraft-tech/ci-github-common/actions/resolve-working-directory@<sha>
  with:
    working-directory: .
```

## Inputs

| **Input**               | **Description**                                         | **Required** | **Default** |
| ----------------------- | ------------------------------------------------------- | ------------ | ----------- |
| **`working-directory`** | Relative or absolute working directory path to resolve. | No           | `.`         |

## Outputs

| **Output**              | **Description**                               |
| ----------------------- | --------------------------------------------- |
| **`working-directory`** | The resolved absolute working directory path. |

## Example

```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: resolve-working-directory
        uses: hoverkraft-tech/ci-github-common/actions/resolve-working-directory@<sha>
        with:
          working-directory: actions/parse-ci-reports

      - name: Show resolved directory
        run: echo "${{ steps.resolve-working-directory.outputs.working-directory }}"
```
