<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stc3F1YXJlIiBjb2xvcj0iYmx1ZSI+PHBvbHlsaW5lIHBvaW50cz0iOSAxMSAxMiAxNCAyMiA0Ij48L3BvbHlsaW5lPjxwYXRoIGQ9Ik0yMSAxMnY3YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmgxMSI+PC9wYXRoPjwvc3ZnPg==) GitHub Action: Record CI reports

<!-- header:end -->
<!-- overview:start -->

## Overview

Register a check before execution and retain validated native evidence afterward.

Register expected native reports before a check, then validate and retain them.
Providers use prepare/finalize internally. For custom commands, use run-check.
Requires contents: read and actions: read. Never forward outputs to ci-reports.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/record-ci-reports@035ff1e0a15666bd00842ec61d7048c2d4e403f3 # feat/native-github-coverage
  with:
    # Lifecycle operation, prepare or finalize.
    # This input is required.
    operation: ""

    # Prepare only. JSON check name, project, variant and typed report selectors. Test and coverage selectors may reference the same native Vitest/Jest JSON file; both requirements are validated and the file is retained once. See docs/usage/ci-reports.md.
    definition: ""

    # Finalize only. Opaque handle from prepare in the same job.
    recording: ""

    # Finalize only. Actual command outcome, success, failure or cancelled.
    outcome: ""

    # Finalize only. Optional original command exit code.
    exit-code: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**        | **Description**                                                                                                                                                                                                                                           | **Required** | **Default** |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`operation`**  | Lifecycle operation, prepare or finalize.                                                                                                                                                                                                                 | **true**     | -           |
| **`definition`** | Prepare only. JSON check name, project, variant and typed report selectors. Test and coverage selectors may reference the same native Vitest/Jest JSON file; both requirements are validated and the file is retained once. See docs/usage/ci-reports.md. | **false**    | -           |
| **`recording`**  | Finalize only. Opaque handle from prepare in the same job.                                                                                                                                                                                                | **false**    | -           |
| **`outcome`**    | Finalize only. Actual command outcome, success, failure or cancelled.                                                                                                                                                                                     | **false**    | -           |
| **`exit-code`**  | Finalize only. Optional original command exit code.                                                                                                                                                                                                       | **false**    | -           |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| **Output**             | **Description**                                     |
| ---------------------- | --------------------------------------------------- |
| **`recording`**        | Local recording handle, used only in the same job.  |
| **`report-directory`** | Fresh private output directory for this check.      |
| **`registration-id`**  | Immutable check registration ID for diagnostics.    |
| **`artifact-id`**      | Retained native result artifact ID for diagnostics. |

<!-- outputs:end -->
