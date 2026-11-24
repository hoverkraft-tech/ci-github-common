# ADR 0003: Wait for artifact discovery through the artifact service

- Status: Accepted
- Date: 2026-11-24

## Context

Uploads can finalize before their IDs appear in the artifact service listing.
The [Node.js failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/45353355215/job/138306946492)
shows a successful REST metadata check followed by a failed download lookup.
Pages deployments and Python report retrieval hit the same visibility delay.

## Decision

Provide `actions/wait-for-artifacts` for current-run artifact IDs. Use the public
`DefaultArtifactClient.listArtifacts` API from `@actions/artifact`, the client used
by upstream download and Pages actions. Require every ID to appear in the latest
artifact listing before continuing. Missing IDs receive bounded exponential
backoff; invalid IDs and service errors propagate without discovery retries.
A fixed sleep would delay successful cases and still fail on longer delays.

Bundle the SDK with ncc and third-party licenses, following ADR 0002. Minify the
bundle to reduce distribution size. Keep source and isolated-distribution tests,
plus one live upload/wait/download contract in the action's dedicated workflow.

The SDK's archive dependencies require overrides for patched glob and minimatch
releases, recorded in the action manifest and lockfile. The documented `glob.sync`
API used by archiver-utils remains available; this action only lists artifacts.
Node.js 24 satisfies the dependencies' runtime requirements.

Secret scanning stays enabled for the distribution. Gitleaks allows only exact
public Azure emulator and CRC64 WebAssembly constants in this bundle. Trivy
allows only the exact [public Azurite key](https://github.com/Azure/Azurite#default-storage-account),
without excluding a file or disabling a rule. Neither value is a private credential.

## Consequences

Callers retain the upstream download and deployment actions. The readiness check
uses the workflow runtime token, without adding GITHUB_TOKEN permissions, changing
the caller's Node.js version, or installing packages at runtime. Cross-run REST
lookups and pattern-only downloads are outside this action's contract. Failures
remain visible when an artifact never appears.
