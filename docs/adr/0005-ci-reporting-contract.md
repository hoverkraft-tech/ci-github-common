# ADR 0005: One CI reporting boundary with validated native evidence

- Status: accepted; implementation and hosted validation in progress
- Date: 2026-11-27
- Supersedes: [ADR 0004](0004-native-github-coverage.md)

## Context

Consumers should describe their checks and choose destinations. They should not
maintain report inventories, coordinate publication concurrency, understand
artifact naming, or convert every native format to Cobertura.

The earlier plan-based interface could lose matrix inventory, made partial
reruns difficult, and treated uploader success as evidence of publication.
Breaking changes are accepted to fix these problems.

## Decision

Keep one public `ci-reports.yml` boundary per originating workflow run. Its
only behavioral inputs are `job-results`, `lint-reporters`,
`test-results-reporters` and `test-coverage-reporters`.
The [consumer and provider contract](../usage/ci-reports.md) defines current
inputs, formats, constraints and migration steps.

Providers register expectations before execution, generate and validate their
native reports, and retain the outcome even when a command fails. The common
recorder exposes only prepare/finalize. A custom-command wrapper provides the
same guarantees without consumer error-handling plumbing.

The collector validates registrations, actual GitHub executions and immutable
assets across nested jobs and matrices. Partial reruns reuse only proven
unchanged executions. No job-display-name guess or last-matrix-output inventory
is accepted.

Language workflows retain detailed tests on every configured runtime. Lint and
coverage run once on the latest configured runtime, selected before execution.
Providers own native shard merging, complete shard sets, source mappings, and
exact tested image/archive provenance.

Independent coverage datasets remain independent. Equivalent representations
are alternatives; overlapping primary datasets require a provider merge.
Retain native files and convert only for a selected destination that requires
conversion. Never relabel merge-result coverage as PR-head coverage.

Lint and test-result publication default to annotations. Coverage defaults to
GitHub Code Quality when positively available, then a comment or summary.
Explicit destinations are required. An unknown capability error or a failed
upload never becomes an automatic fallback.

Every selected destination produces a receipt tied to its dataset, tested
source and content digest. Distinguish submitted, published, unavailable,
superseded and failed outcomes. Missing or duplicate receipts fail completion.
GitHub coverage requires a report ID and confirmed processing success.
Codecov and Coveralls use pinned official uploaders in strict submission mode.
Coveralls completion waits for all expected datasets and uses no carryforward.

Only the comment update is serialized. One exact bot-owned marker identifies
the PR, repository and calling workflow. Recheck the PR head and existing run
freshness before replacing it. Publish the canonical Actions summary after the
comment attempt, then enforce the stable "CI reports complete" check.

Use progressive disclosure with closed Markdown details and one disclosure
level. Keep the outcome, required failures, missing evidence, publication
failures, tested source and navigation visible. Avoid duplicate annotations and
comments. Bound views and disclose truncation. Never infer test counts from job
status or average coverage percentages.

## Security and permissions

The caller grants a fixed ceiling; each publisher receives a narrower token.
Collection needs only Actions reads. Publishers execute no project scripts and
install no project dependencies. Native files are untrusted input, with path,
symlink, format, checksum and resource checks. Report text is escaped before
Markdown rendering.

Cancellation stops publication. Forks preserve read-only diagnostics. Explicit
write destinations fail when unavailable; automatic comment fallback reports
its limitation in the summary.

## Temporary upstream workaround

As checked on 2026-11-27, the released official GitHub coverage uploader can
exit successfully without uploading and exposes no structured publication
outcome. The common adapter uses the same REST upload protocol, requires its
report ID and polls processing to completion.

Track [upstream issue 36](https://github.com/actions/upload-code-coverage/issues/36)
and [PR 37](https://github.com/actions/upload-code-coverage/pull/37).
Replace the adapter with a pinned released action after its structured outputs
can establish successful processing. A FIXME beside the adapter records this
removal condition.

## Consequences and rollout

Common releases before providers. Preserve local self references; use released
cross-repository dependencies. Common's own existing released Node.js workflows
remain status-only until their producer migration, avoiding a cyclic release
dependency.

Validate the common implementation and inspect real GitHub feedback first.
Then adapt language and container providers, followed by representative consumer
repositories. Provider adoption requires tested support for their native
formats and execution contracts.

Before release, exercise real native processing on an enabled repository,
automatic fallback on a repository without Code Quality, and selected Codecov
and Coveralls submissions. A green unit suite or skipped uploader does not
satisfy a publication acceptance check. Repository service enrollment remains
an explicit owner decision.
