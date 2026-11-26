<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItZmlsZS10ZXh0IiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTE0IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY4eiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjE0IDIgMTQgOCAyMCA4Ij48L3BvbHlsaW5lPjxsaW5lIHgxPSIxNiIgeTE9IjEzIiB4Mj0iOCIgeTI9IjEzIj48L2xpbmU+PGxpbmUgeDE9IjE2IiB5MT0iMTciIHgyPSI4IiB5Mj0iMTciPjwvbGluZT48cG9seWxpbmUgcG9pbnRzPSIxMCA5IDkgOSA4IDkiPjwvcG9seWxpbmU+PC9zdmc+) GitHub Action: Record CI reports

<!-- header:end -->
<!-- overview:start -->

## Overview

Retain native test, lint and Cobertura reports in one checked artifact.
Language actions normally call this action automatically. It posts no PR comments.
Forward its `report-plan` output from a standalone job to the common CI reports
workflow. Reusable producer workflows expose their complete plan automatically.

Plans identify expected executions before tools run. A custom matrix creates one
complete plan from its matrix configuration and passes each selection to its
producer. Forward the complete plan from the configuration job, because matrix
workflow outputs retain only one invocation.

The plan, discover, collect and verify operations support reusable workflow
orchestration. Ordinary producers use record. Required reports remain required
after failed commands; available diagnostics are uploaded before failure.
Coverage is Cobertura XML with stable component labels. Frameworks merge shards
first. Coverage must describe the PR head or current push revision.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/record-ci-reports@af0bdd6313bd49aaf4a8a7f0de005fb0db856b03 # 4.3.3
  with:
    # Internal orchestration operation, plan, discover, collect or verify. Ordinary producers use record.
    # Default: `record`
    operation: record

    # Project directory for record, downloaded artifact directory for collect or verify.
    # Default: `.`
    working-directory: .

    # JSON plan supplied by the producer workflow. Empty creates a standalone plan.
    report-plan: ""

    # JSON array of producer definitions for plan, with key, type, directory and coverage descriptions.
    # Default: `[]`
    producers: "[]"

    # Standalone producer type, test or lint.
    # Default: `test`
    type: test

    # Native report paths or auto selectors. Empty discovers the producer type and adds planned coverage paths.
    report-paths: ""

    # Native Super-Linter summary relative to working-directory, instead of parsed lint diagnostics.
    summary-file: ""

    # JSON array of Cobertura file, language and optional label for a standalone producer.
    # Default: `[]`
    coverage: "[]"

    # Source mappings forwarded to the native report parser.
    path-mapping: ""

    # JSON needs context for discover and collect, including report-plan outputs.
    # Default: `{}`
    job-results: "{}"

    # Internal collector publication selection, `none`, `github` or `codecov`.
    # Default: `none`
    provider: none

    # Validated coverage descriptors for verify. Empty verifies the entire validated collection.
    # Default: `[]`
    reports: "[]"

    # Optional JSON context retained with diagnostics, such as tested image identity, engine and platform. It does not establish successful validation.
    # Default: `{}`
    metadata: "{}"

    # Tested commit for a prebuilt container without Git metadata.
    source-sha: ""

    # Repository-relative project directory for a prebuilt container without Git metadata.
    source-prefix: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                   | **Required** | **Default** |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`operation`**         | Internal orchestration operation, plan, discover, collect or verify. Ordinary producers use record.                                               | **false**    | `record`    |
| **`working-directory`** | Project directory for record, downloaded artifact directory for collect or verify.                                                                | **false**    | `.`         |
| **`report-plan`**       | JSON plan supplied by the producer workflow. Empty creates a standalone plan.                                                                     | **false**    | -           |
| **`producers`**         | JSON array of producer definitions for plan, with key, type, directory and coverage descriptions.                                                 | **false**    | `[]`        |
| **`type`**              | Standalone producer type, test or lint.                                                                                                           | **false**    | `test`      |
| **`report-paths`**      | Native report paths or auto selectors. Empty discovers the producer type and adds planned coverage paths.                                         | **false**    | -           |
| **`summary-file`**      | Native Super-Linter summary relative to working-directory, instead of parsed lint diagnostics.                                                    | **false**    | -           |
| **`coverage`**          | JSON array of Cobertura file, language and optional label for a standalone producer.                                                              | **false**    | `[]`        |
| **`path-mapping`**      | Source mappings forwarded to the native report parser.                                                                                            | **false**    | -           |
| **`job-results`**       | JSON needs context for discover and collect, including report-plan outputs.                                                                       | **false**    | `{}`        |
| **`provider`**          | Internal collector publication selection, `none`, `github` or `codecov`.                                                                          | **false**    | `none`      |
| **`reports`**           | Validated coverage descriptors for verify. Empty verifies the entire validated collection.                                                        | **false**    | `[]`        |
| **`metadata`**          | Optional JSON context retained with diagnostics, such as tested image identity, engine and platform. It does not establish successful validation. | **false**    | `{}`        |
| **`source-sha`**        | Tested commit for a prebuilt container without Git metadata.                                                                                      | **false**    | -           |
| **`source-prefix`**     | Repository-relative project directory for a prebuilt container without Git metadata.                                                              | **false**    | -           |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                                   |
| ----------------- | ----------------------------------------------------------------- |
| **`report-plan`** | Expected producer plan. Forward this from standalone jobs.        |
| **`selections`**  | Plans indexed by producer key, for internal matrix orchestration. |
| **`pattern`**     | Exact artifact pattern for the plans in job-results.              |
| **`artifact-id`** | Uploaded report or validated collection artifact ID.              |
| **`complete`**    | Whether the required report collection is complete.               |
| **`reports`**     | Validated coverage descriptors used by internal publication jobs. |
| **`markdown`**    | Consolidated CI feedback.                                         |
| **`file`**        | Verified Cobertura file for an official uploader.                 |
| **`files`**       | Comma-separated verified Cobertura files for Codecov.             |

<!-- outputs:end -->
