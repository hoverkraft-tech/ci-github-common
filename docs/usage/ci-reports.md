# CI reports

Run checks in ordinary jobs. Call the reporting workflow once, after every job
that produces reports. It discovers registered checks across reusable workflows
and matrices, validates native evidence, and publishes the selected destinations.

The stable completion check is "CI reports complete". Keep this check required
alongside existing routing checks that decide whether conditional jobs may skip.

## A custom project

The example assumes a test script that accepts a JUnit output path. Replace the
command with the project's actual runner. Pin both actions to the same released
common commit.

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
    steps:
      # Checkout and install the project's tools before running the check.
      - uses: hoverkraft-tech/ci-github-common/actions/quality/run-check@<commit-sha>
        with:
          name: Application tests
          command: npm test -- --reporter=junit --outputFile="$CI_REPORTS_DIR/junit.xml"
          test-results: junit.xml

  reports:
    needs: tests
    if: ${{ always() }}
    uses: hoverkraft-tech/ci-github-common/.github/workflows/ci-reports.yml@<commit-sha>
    permissions:
      actions: read
      contents: read
      pull-requests: write
      code-quality: write
      id-token: write
      security-events: write
    with:
      job-results: ${{ toJSON(needs) }}
```

The wrapper creates a fresh directory, registers expected files before execution,
and preserves the command's original failure. It validates and retains reports
even after an ordinary command failure. Do not add `continue-on-error`.
It removes only its own report storage, never project resources.

Report patterns are relative to `CI_REPORTS_DIR`. Every pattern is required.
Old files elsewhere in the checkout cannot satisfy a new check. Copying an old
report into that directory does not make it a fresh measurement; producers must
generate reports during the registered command.

## Destinations

| Input                     | Default       | Allowed selections                                  |
| ------------------------- | ------------- | --------------------------------------------------- |
| `lint-reporters`          | `annotations` | `annotations`, `comment`, `code-scanning`           |
| `test-results-reporters`  | `annotations` | `annotations`, `comment`                            |
| `test-coverage-reporters` | `auto`        | `auto`, `github`, `codecov`, `coveralls`, `comment` |

Use one selection per line. Repeated selections are deduplicated. An explicit
empty string disables that kind's publication; required reports and failing
checks still fail CI.

For example, add coverage to Codecov as well as the default GitHub destination:

```yaml
with:
  job-results: ${{ toJSON(needs) }}
  test-coverage-reporters: |
    auto
    codecov
  test-results-reporters: |
    annotations
    comment
```

`auto` uses GitHub Code Quality only when eligibility and feature availability
are positively established. Known unavailable contexts use the PR comment, or
the Actions summary when no writable PR exists. Unknown access failures and
upload or processing errors fail publication; they do not trigger fallback.
Adding explicit `github` makes native publication required, including when
`auto` is also present.

Code Quality must already be enabled. This workflow does not change repository
settings. GitHub requires an eligible PR-head or default-branch measurement.
Coverage measured against a PR merge commit stays labeled as merge coverage.
The workflow never changes the checkout or relabels a measurement to satisfy
a destination.

Codecov uses OIDC unless the optional `codecov-token` secret is supplied.
Coveralls uses the job's GitHub token. Configure the corresponding service for
the repository before selecting it. The official uploaders receive explicit
validated files. Search, plugins, empty-upload success and carryforward are
disabled. External receipts say "submitted"; they do not claim confirmed
provider processing.

Callers grant the fixed permission ceiling shown in the example. Each internal
job receives only its required permissions. Publishers install no project
dependencies and execute no project scripts. Fork runs retain diagnostics and
summaries. Explicit publication requiring unavailable write access fails;
automatic comment fallback on a fork reports that it is unavailable.

## Multiple projects, runtimes and shards

Use `working-directory` for independent projects, for example `frontend` and
`backend`. Identical report basenames are safe because every registration has
its own immutable artifact. Results remain separate by project and coverage
dataset. Percentages are never averaged into an overall score.

Keep detailed test results from every runtime. Language workflows select the
latest configured runtime before execution and collect lint and coverage once.
The reporting workflow itself runs once outside the runtime matrix.
Provider adapters own this policy; custom matrices must select their coverage
run explicitly.

For overlapping suites or shards, use the framework's native merge before
recording the final coverage dataset. Retain every shard's test outcomes. A
provider declaring a shard merge must provide the complete expected and included
shard sets. Missing shards cannot produce a complete coverage result.

Equivalent LCOV and Cobertura files may represent one dataset. The collector
checks their source sets and line counts and selects one representation for
each destination. Multiple files of the same coverage format require a native
merge.

## Provider recording contract

Language and container adapters use
[`record-ci-reports`](../../actions/quality/record-ci-reports/README.md).
Ordinary consumers use their language action or `run-check`.

1. Call `operation: prepare` with a JSON definition before the command.
2. Write reports under the returned `report-directory`.
3. Call `operation: finalize` with the returned `recording` handle and the
   command's actual `outcome`. Use a condition that still runs after ordinary
   command failure. Finalization must execute in the same job.

A definition can contain:

```json
{
  "name": "API unit tests",
  "project": "api",
  "suite": "unit",
  "variant": { "runtime": "Python 3.14" },
  "reports": [
    { "kind": "test", "pattern": "junit.xml" },
    {
      "kind": "coverage",
      "pattern": "coverage.xml",
      "dataset": "unit",
      "language": "Python",
      "role": "primary"
    }
  ]
}
```

| Field             | Contract                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `suite`   | Bounded, nonempty display name and stable suite key. Defaults: "Custom check", "default".                                                                                                 |
| `project`         | Existing repository-relative directory without symlink aliases. Default: `.`.                                                                                                             |
| `variant`         | Provider-known string dimensions, such as runtime, platform and shard.                                                                                                                    |
| `reports`         | One to 128 typed selectors with `kind` (`test`, `lint`, `coverage`) and a relative `pattern`.                                                                                             |
| `optional`        | Selector boolean. Default false. Absent optional files do not create measurements.                                                                                                        |
| `owner`           | Diagnostic owner: `collector` (default) or `tool`. Tool-owned annotations and code scanning are not republished.                                                                          |
| `dataset`, `role` | Coverage key (default suite) and `primary` (default) or `diagnostic`. Diagnostic coverage remains in the summary.                                                                         |
| `language`        | Coverage language. Inferred only when covered extensions identify exactly one language.                                                                                                   |
| `shards`          | Coverage merge metadata: unique `expected` and `included` string arrays. The sets must match.                                                                                             |
| `source`          | Optional `{"sha":"<40-character SHA>"}` assertion, which must match the actual checkout.                                                                                                  |
| `path-mapping`    | Native path prefixes mapped to repository-relative prefixes. Conflicting mappings fail.                                                                                                   |
| `subject`         | Optional tested image/archive metadata: `kind`, `name`, `digest` (`sha256:...`), optional `platform` and `engine`. Providers verify build provenance and record the exact tested subject. |

Native test formats currently include JUnit and TAP. Lint formats use the existing
ESLint, Checkstyle, Prettier, Astro and SARIF parsers. The shared linter retains
its native Super-Linter summary and keeps ownership of its diagnostics.
Coverage currently accepts LCOV and Cobertura. Additional language-native
adapters must be implemented and verified before their provider migrations.

The version 2 protocol retains an immutable registration, a result, native files
and checksums. Consumers never assemble manifests or forward artifact IDs.
Files must be regular files without symlinks, at most 64 MiB each; a recording is
limited to 256 MiB of native assets, 512 files and 4 MiB of normalized metadata.
Malformed safe files remain available for diagnosis and cannot be published.

## Reruns and feedback

Partial reruns reuse evidence only when GitHub's original and current job
metadata prove the execution is unchanged. A reused display name alone is not
sufficient. An actually rerun producer needs a new registration and result.
Expired or missing evidence requires rerunning the affected producer.

Cancellation prevents publication. The bounded final job still reports that
completion was not established.

One owned PR comment is updated after publishers settle. It shows selected
sections, with closed details for test executions, lint findings and coverage
datasets. Failures, missing evidence, tested source and navigation remain visible.
Older runs cannot overwrite newer comment results.

The final Actions summary is written after the comment attempt. It includes
all report kinds, producer outcomes, publication outcomes and comment delivery.
Coverage changes are percentage points against a compatible retained measurement
for the exact PR base commit. Missing baselines are labeled unavailable, never
treated as zero. Views have explicit truncation notices and links to full native
artifacts.

## Migration and release order

This replaces the previous `report-plan`, `coverage` and `comment` interface.
Release common first, then update language and container producers, then their
consumers. Common's CI keeps released Node.js workflows as status-only checks
until the Node.js producer adapter is released. Its own recording and wrapper
tests exercise the new protocol now.

Native GitHub processing and explicit external destinations require live
validation in configured repositories before release. Unit tests and a successful
automatic fallback are not substitutes for those checks.
