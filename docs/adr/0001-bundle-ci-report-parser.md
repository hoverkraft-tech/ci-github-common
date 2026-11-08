# ADR 0001: Bundle the CI report parser

- Status: Proposed
- Date: 2026-11-08
- Related: [Pleey CI optimization, P2.2](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

The report action installs its dependencies through Node setup for every lint or
test job. Parsing needs no installation in the caller's workspace. The action
already receives `core` and `glob` from `actions/github-script` and supports Node
24 and later. There is no distribution build in this repository.

An explicitly requested report can currently match no files and produce only a
warning. That can hide a broken report producer or an incorrect container path.

## Decision

Use [ncc](https://github.com/vercel/ncc#usage) as a locked development dependency
to bundle the existing ESM entrypoint and its runtime dependencies. Commit the
complete distribution, including the generated third-party licenses. Keep the
composite action and its `github-script` runtime; load the distribution instead
of source, removing Node setup and `NODE_PATH`. Do not add another runtime or
bundle the toolkit already provided by `github-script`.

Rebuild with a clean lockfile installation in CI and reject any difference from
the committed distribution, including added or removed files. Test an isolated
copy of the distribution with no package dependencies. Exercise host and
container action execution and preserve summaries, outputs, path rewriting,
annotations and `fail-on-error`. A reporting step cannot turn an earlier failed
lint/test step into a successful job.

Require every explicit positive report path or glob to match at least one file
after exclusions. Missing explicit reports fail independently of `fail-on-error`,
which controls failures _inside_ valid reports. Auto-detection retains its
optional zero-match behavior; exclusions do not require a match. Mixed inputs
retain these rules for each explicit pattern. This is an intentional tightening
of the input contract and must be identified in release notes.

## Alternatives and consequences

Keeping action-time installation repeats setup and depends on registry access.
A native JavaScript action would need new toolkit dependencies and a different
entrypoint without helping the current contract. esbuild would also bundle the
code, but ncc supplies dependency-license collection without custom tooling.

Generated code increases checkout/download size. Measure that size, startup and
processing separately from installation overhead; do not claim Pleey end-to-end
savings from a parser fixture. Source and lockfile changes require rebuilding the
distribution. Existing dependency automation remains responsible for updates.

## Validation and rollout

Local validation on 2026-11-08 passed 120 tests on Node 24.22.2, including
source/distribution parity for all nine formats, malformed and missing reports,
path mapping and isolated distribution loading. The distribution rebuild check,
workflow syntax and repository lint passed.
[Hosted validation](https://github.com/hoverkraft-tech/ci-github-common/actions/runs/42509255618)
on implementation commit `cf0077159296a1897650eb2c1ea910c9ee534606` passed the
source tests, distribution rebuild, host/container action probes and consolidated
reporting integration. The probes verify missing explicit reports,
`fail-on-error`, optional auto-detection and the preserved failed producer outcome.

Five consecutive local pairs after priming compared source at
`979e86fa119f625fa9be3eed7342462cb450c285` with this distribution. Each pair ran
`npm ci --ignore-scripts --no-audit --no-fund` against an already warm isolated
cache, then a fresh Node process parsed the same one-test JUnit and one-line LCOV
fixture. The bundle used a fresh process without installation. Both paths
asserted two parsed files and no report errors. All pairs passed.

| Local median measurement   | Source | Distribution |
| -------------------------- | -----: | -----------: |
| Dependency installation    | 318 ms |         None |
| Fresh process with parsing | 170 ms |       144 ms |
| Installation plus process  | 488 ms |       144 ms |

The first empty-cache installation took 600 ms and is excluded from the warm
medians. Import plus parsing took approximately 46 ms for source and 23 ms for
the distribution; source defers imports into `run`, so import time alone is not
comparable. The committed distribution is 306,615 bytes, approximately 80,261
bytes when gzip-compressed. This is added transfer volume, not measured GitHub
action download latency. The fixture excludes runner scheduling, Node setup,
Actions cache transfer and checkout; it does not establish Pleey end-to-end gains.
Raw measurements stay outside the repository.

Adopt a reviewed immutable upstream release through the Node actions before
changing Pleey's consumer pin. This independent upstream work does not require
Pleey PR #553 to merge. Rollback restores the parser/consumer pins; no cache
migration is necessary.

### Generated-code analysis

The first full workflow passed, but its separate CodeQL check reported
`js/bad-tag-filter` in the generated copy of `is-unsafe` 2.0.3's
`src/contexts/xml.js`. The pattern detects the XML comment terminator `-->`;
the query expects HTML's additional `--!>` terminator. This is an existing
transitive dependency of the unchanged `fast-xml-parser` lock entry, newly
visible to source analysis because the bundle is committed.

Use a shared CodeQL configuration to exclude only this generated distribution
from the three existing JavaScript scans. Maintained source remains scanned with
the default queries; dependency review remains enabled for locked packages, and
the build gate verifies generated output against source. Do not hand-edit vendor
code, dismiss alerts globally or disable a security query. This does not claim to
repair or certify the upstream dependency. Revalidate the standalone CodeQL check
as well as the workflow result before handing over the PR.
