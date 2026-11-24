# ADR 0003: Retry artifact consumption through the official SDK

- Status: Accepted
- Date: 2026-11-24

## Context

Uploads can finalize before their IDs appear in the artifact service listing.
The [original Node.js failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/45353355215/job/138306946492)
shows a successful REST metadata check followed by a failed download lookup.
[Validation of a separate readiness check](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/45431382022/job/138577313649)
also found an ID before the next listing returned no artifacts. A successful
listing does not guarantee visibility in a subsequent request.

## Decision

Provide `actions/download-artifact` for explicit artifact IDs using the public
`DefaultArtifactClient` from `@actions/artifact`. Retry missing metadata and
artifact-not-found download failures together, with bounded exponential backoff.
Every requested ID must download successfully. Do not repeat completed downloads.
Preserve SDK extraction, raw-file downloads and digest verification. Digest,
permission, extraction and other service errors fail immediately.

Current-run downloads use the workflow runtime token. An explicit GitHub token
uses the SDK's REST path with the requested repository and workflow run. Only
404 responses from the download operation are retried on that path. Missing
metadata is retried; list API errors propagate. Name/pattern matching is outside
this action's contract, so callers cannot silently accept an incomplete result.

Bundle the SDK with ncc and third-party licenses, following ADR 0002. Minify the
bundle to reduce distribution size. Keep source and isolated-distribution tests,
plus one live upload/download contract in the action's dedicated workflow. The
live check covers the runner/runtime-token boundary; deterministic tests cover
visibility regressions without network delays.

The SDK's archive dependencies require overrides for patched glob and minimatch
releases, recorded in the action manifest and lockfile. The documented `glob.sync`
API used by archiver-utils remains available. Node.js 24 satisfies the runtime
requirements.

Secret scanning stays enabled for the distribution. Gitleaks allows only exact
public Azure emulator and CRC64 WebAssembly constants in this bundle. Trivy
allows only the exact [public Azurite key](https://github.com/Azure/Azurite#default-storage-account),
without excluding a file or disabling a rule. Neither value is a private credential.

## Consequences

Known-ID consumers replace upstream download steps with this action. The action
requires no runtime installation or change to the caller's Node.js version.
Missing artifacts remain failures after the bounded retry budget is exhausted.
Pages metadata discovery needs a retry in the deployment action itself; a
separate readiness check cannot eliminate that race.
