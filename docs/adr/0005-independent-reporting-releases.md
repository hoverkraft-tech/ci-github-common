# ADR 0005: Release common reporting independently of its producers

- Status: accepted
- Date: 2026-11-26
- Related: [ADR 0004: Unified CI reporting](0004-native-github-coverage.md)

## Context

The unified reporting change made common's eight JavaScript action test workflows
depend on the unreleased Node.js producer workflow. That producer also depended
on the common reporting change. This coupled the two PRs and their releases.

Common must validate its own reporting primitives before downstream producers
adopt them. Its source tests need npm installation, the existing `test:ci` scripts,
native report retention, CodeQL and dependency review. They do not need the
language workflow's build, packaging, container or shard orchestration.

## Decision

Use one internal source-test helper shared by the dedicated action test workflows.
It calls the released Node.js setup action, creates a report plan before installing
dependencies, runs `npm run test:ci`, and records native results with common's local
action. Failed commands still retain reports. Source tests have read-only access;
CodeQL and dependency review remain separate jobs.

Common may consume released language tooling. Its CI must not require a language
producer PR that adopts the same unreleased common contract. Keep immutable pins
with release comments. The public reporting contract in ADR 0004 is unchanged.

The release order is:

1. Merge and release common using existing released Node.js tooling.
2. Replace the producer PRs' development common pins with that common release.
3. Merge and release the updated producer workflows.

This small internal helper centralizes the eight packages' source-test setup. It
does not replace the public Node.js CI workflow. Existing unit, distribution and
action integration tests remain the validation of behavior; no second report
format or compatibility adapter is introduced.
