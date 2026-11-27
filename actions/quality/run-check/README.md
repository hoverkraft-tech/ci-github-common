<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItcGxheS1jaXJjbGUiIGNvbG9yPSJibHVlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PHBvbHlnb24gcG9pbnRzPSIxMCA4IDE2IDEyIDEwIDE2IDEwIDgiPjwvcG9seWdvbj48L3N2Zz4=) GitHub Action: Run check

<!-- header:end -->
<!-- overview:start -->

## Overview

Run a custom check and retain its promised test, coverage and lint reports.

Run a custom check with validated native reports and automatic retention.
Write only fresh outputs under $CI_REPORTS_DIR. Patterns are relative to it.
A command failure retains diagnostics and fails the action; no continue-on-error
is needed. Requires Linux, Bash, contents: read and actions: read.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/run-check@beab1278f3b6e89f3c2e91e774071efb82073a6c # feat/native-github-coverage
  with:
    # Bash command. Write native reports under the fresh CI_REPORTS_DIR environment variable.
    # This input is required.
    command: ""

    # Human-readable check name.
    # Default: `Custom check`
    name: Custom check

    # Repository-relative project directory.
    # Default: `.`
    working-directory: .

    # Newline-separated native test report patterns, relative to CI_REPORTS_DIR.
    test-results: ""

    # Newline-separated native coverage patterns, relative to CI_REPORTS_DIR. One measurement per project.
    test-coverage: ""

    # Newline-separated native lint report patterns, relative to CI_REPORTS_DIR.
    lint-results: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                      | **Required** | **Default**    |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------ | -------------- |
| **`command`**           | Bash command. Write native reports under the fresh CI_REPORTS_DIR environment variable.              | **true**     | -              |
| **`name`**              | Human-readable check name.                                                                           | **false**    | `Custom check` |
| **`working-directory`** | Repository-relative project directory.                                                               | **false**    | `.`            |
| **`test-results`**      | Newline-separated native test report patterns, relative to CI_REPORTS_DIR.                           | **false**    | -              |
| **`test-coverage`**     | Newline-separated native coverage patterns, relative to CI_REPORTS_DIR. One measurement per project. | **false**    | -              |
| **`lint-results`**      | Newline-separated native lint report patterns, relative to CI_REPORTS_DIR.                           | **false**    | -              |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                                                   |
| ----------------- | --------------------------------------------------------------------------------- |
| **`artifact-id`** | Native result artifact ID for diagnostics. ci-reports discovers it automatically. |

<!-- outputs:end -->
