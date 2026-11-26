<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYmFyLWNoYXJ0LTIiIGNvbG9yPSJibHVlIj48bGluZSB4MT0iMTgiIHkxPSIyMCIgeDI9IjE4IiB5Mj0iMTAiPjwvbGluZT48bGluZSB4MT0iMTIiIHkxPSIyMCIgeDI9IjEyIiB5Mj0iNCI+PC9saW5lPjxsaW5lIHgxPSI2IiB5MT0iMjAiIHgyPSI2IiB5Mj0iMTQiPjwvbGluZT48L3N2Zz4=) GitHub Action: Coverage reports

<div align="center">
  <img src="../../../.github/logo.svg" width="60px" align="center" alt="Coverage reports" />
</div>

---

<!-- header:end -->
<!-- overview:start -->

## Overview

Prepare, collect and verify Cobertura artifacts for native GitHub Code Quality.

Test jobs use `operation: prepare` without write permissions. Reports must come
from the PR head commit or current push commit. Each report has a Linguist
language and a stable component label. With one report, the label defaults to
its repository-relative working directory, or `root`. Multiple reports require
explicit, unique labels. Shards and overlapping suites must be merged first.

Pass `reports` as a JSON array, for example:
`[{"file":"cobertura.xml","language":"Python","label":"backend"}]`.
Source filenames are resolved against the checkout and Cobertura sources, then
normalized to repository-relative paths. Missing files, ambiguous paths and
invalid XML fail. Zero covered lines are valid; zero instrumented lines are not.

The [CI reports workflow](../../../.github/workflows/ci-reports.md) uses
`operation: collect` to validate the expected components, producer outcomes,
commit, run attempt, checksums and source overlap before preparing publication.
The [publication workflow](../../../.github/workflows/publish-coverage.md) uses
`operation: verify` before invoking GitHub's official uploader for each report.
Native coverage artifacts are retained for seven days, including after test
failures. A failed producer cannot publish an incomplete coverage baseline.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/coverage-reports@6535a964c5ba86fe0baab0fb5a41a066587a8688 # feat/native-github-coverage
  with:
    # Operation: prepare in a test job, collect after producers, or verify one publication report.
    # Default: `prepare`
    operation: prepare

    # Project directory for prepare; downloaded artifact directory for collect or verify.
    # Default: `.`
    working-directory: .

    # JSON array of file, language and optional label for prepare; exactly one collected report for verify. Filenames must be explicit relative paths, without globs.
    # Default: `[]`
    reports: "[]"

    # Outer calling job ID used by ci-reports job-results. Defaults to the current job ID.
    report-group: ""

    # JSON array of job and label identifying every required component for collect. Missing, additional or duplicate components fail.
    # Default: `[]`
    expected-reports: "[]"

    # JSON needs context for collect. Every expected producer must have succeeded.
    # Default: `{}`
    job-results: "{}"

    # Explicit tested commit for a prebuilt container without Git metadata. Must match the PR head or current push. A checkout's actual commit is always checked when available.
    source-sha: ""

    # Repository-relative directory represented by working-directory in a prebuilt container; use a dot for the repository root. Required with source-sha when Git metadata is absent.
    source-prefix: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                                                  | **Required** | **Default** |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`operation`**         | Operation: prepare in a test job, collect after producers, or verify one publication report.                                                                                     | **false**    | `prepare`   |
| **`working-directory`** | Project directory for prepare; downloaded artifact directory for collect or verify.                                                                                              | **false**    | `.`         |
| **`reports`**           | JSON array of file, language and optional label for prepare; exactly one collected report for verify. Filenames must be explicit relative paths, without globs.                  | **false**    | `[]`        |
| **`report-group`**      | Outer calling job ID used by ci-reports job-results. Defaults to the current job ID.                                                                                             | **false**    | -           |
| **`expected-reports`**  | JSON array of job and label identifying every required component for collect. Missing, additional or duplicate components fail.                                                  | **false**    | `[]`        |
| **`job-results`**       | JSON needs context for collect. Every expected producer must have succeeded.                                                                                                     | **false**    | `{}`        |
| **`source-sha`**        | Explicit tested commit for a prebuilt container without Git metadata. Must match the PR head or current push. A checkout's actual commit is always checked when available.       | **false**    | -           |
| **`source-prefix`**     | Repository-relative directory represented by working-directory in a prebuilt container; use a dot for the repository root. Required with source-sha when Git metadata is absent. | **false**    | -           |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **`artifact-id`** | Uploaded native coverage artifact ID for prepare or collect.                                        |
| **`reports`**     | JSON report collection with file, language and stable label, suitable for the publication workflow. |
| **`file`**        | Verified absolute Cobertura file for the official uploader.                                         |

<!-- outputs:end -->
