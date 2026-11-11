# ADR 0002: Distribute and maintain action-owned dependencies

- Status: Accepted
- Date: 2026-11-08
- Updated: 2026-11-09
- Related: [CI optimization issue](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

[ADR 0001](0001-bundle-ci-report-parser.md) removes installation of the report
parser's own dependencies. The same recurring cost can occur in other actions.
The audit covers all six `hoverkraft-tech/ci-github-*` repositories returned by
the organization catalog, including nested composite actions and their scripts.
The following snapshot records the audit on 2026-11-08.

Repeating action paths and isolated bundle runners across consumers makes adding
packages error-prone. Package discovery and shared validation belong alongside
the distribution maintenance contract.

| Repository          | Revision       | Actions | Own Node.js installations |
| ------------------- | -------------- | ------: | ------------------------: |
| ci-github-common    | `979e86fa119f` |      14 |                         2 |
| ci-github-container | `dc707d83a7cc` |      17 |                         2 |
| ci-github-iac       | `1158c1f23be1` |       5 |                         0 |
| ci-github-nodejs    | `0340fba99303` |      16 |                         0 |
| ci-github-php       | `41b42b7c00ad` |       4 |                         0 |
| ci-github-publish   | `704e6c786af0` |      25 |                         4 |

This is 81 action manifests and eight internal dependency installations.
Node.js and PHP project installation, package-manager bootstrap, and IaC tools
such as Ansible are execution requirements, not internal JavaScript helpers.
Dependency-free helpers gain nothing from adding a bundler.

## Decision

Apply the distribution contract from ADR 0001 to eligible helpers: a locked
build, committed output and license notices, reproducibility checks, source
coverage, and isolated distribution tests. Preserve each action's existing
inputs, outputs, side effects and error handling. The report parser's explicit
missing-report policy is specific to that action.

A successful compiler exit is insufficient. Dynamic configuration, plugins,
provider loading and native binaries must work without development dependencies
before their runtime installation can be removed. Keep related common changes
in PR #643; submit implementation in each other owning repository for its CI.

| Action                                  | Outcome                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| common: quality/parse-ci-reports        | Bundled in [PR #643](https://github.com/hoverkraft-tech/ci-github-common/pull/643). |
| publish: release/get-configuration      | Implement a distribution and preserve configuration scope.                          |
| publish: release/prepare                | Implement a distribution and preserve preview/draft behavior.                       |
| container: helm/release-chart           | Bundle the YAML lockfile helper; retain Helm execution.                             |
| common: quality/lint-pull-request-title | Retain installation until dynamic configuration loading is packaged and tested.     |
| publish: release/summarize-changelog    | Retain installation until all supported provider loaders are bundled.               |
| publish: deploy/jampack                 | Retain platform-aware installation for native dependencies.                         |
| container: helm/generate-docs           | Retain the configurable documentation toolchain pending plugin distribution.        |

## Package discovery and validation

Discover root and `actions/**` package manifests declaring the selected build
script and `check:dist`. This replaces the initial explicit-directory-only policy;
callers may still select literal directories or glob patterns. Reject overlapping
package scopes. An empty discovery result is a successful no-op.

The builder and writer read manifests from the PR's trusted default-branch base
revision; ordinary CI discovers packages at the tested revision. Discovery never
executes repository code. A PR cannot expand the writer's allowed output paths by
editing package manifests. Existing identity, artifact, path and atomic-head
checks remain mandatory.

The shared test workflow generates a package matrix for host and container runs.
A separate quality action owns isolation and cleanup; each package owns its
contract tests and selects them with `test:distribution`. Generated-output
exclusions use recursive action patterns. Existing action integration and security
checks remain necessary alongside distribution checks.

## Automated distribution maintenance

Follow the split-permission pattern in `actions/attest`. Expose one public reusable
`action-distributions.yml` workflow backed by the dedicated
`actions/action-distributions` composite action. The action owns the helper,
validated inputs and focused tests. It runs through github-script from its own
committed bundle, including a maintained YAML parser for trusted workflow
definitions. No runtime dependency installation is needed.

Consumers keep two small event callers: a read-only `pull_request` build and a
trusted default-branch `workflow_run` writer. Both invoke the same public reusable
workflow, which selects separate jobs by event. Only the writer caller passes the
App secret. Shared settings are repeated through inputs, following the preference
for explicit caller configuration over a separate config file.

During review on 2026-11-09, a single combined event caller was tested. GitHub
[rejected its definition](https://github.com/hoverkraft-tech/ci-github-common/actions/runs/42577213586)
because a workflow cannot listen to its own completion. Retain the two event files;
consolidating the reusable workflow still centralizes the implementation. Do not
move the writer into a PR execution or bypass distribution checks to reduce the
number of files. Keep separate build and writer concurrency groups so a new build
cannot cancel publication. Live event routing remains a post-merge acceptance check.

Workflow inputs configure package directories, npm script, Node.js version, output
paths, required files, artifact retention, author rules and commit headline. No
separate repository configuration file is introduced.
Support Dependabot and hosted Renovate presets, plus explicit login/ID and optional
branch-prefix rules for custom automation accounts. Common and container use
`hoverkraft-bot[bot]` for self-hosted Renovate, so checking only `renovate[bot]` is
insufficient. The PR author and originating actor must match the configured rule;
a branch prefix or label alone never authorizes a write.

The `pull_request` builder uses its caller inputs and builds the exact PR head
without write credentials. It installs locked dependencies with
lifecycle scripts disabled. Grouped, lockfile-only and build-tool updates produce
one artifact. Each package's existing script owns bundling and license generation.

The `workflow_run` writer validates GitHub-provided run metadata, the resolved
originating workflow, repository, author, actor, branch and unchanged open PR. Its
policy inputs come from the trusted default-branch caller. The artifact contains
file bytes only and cannot select the branch or expand the allowed output paths. The writer
never checks out or executes PR code. Origin checks and atomic head validation are
mandatory and have no disable switch.

The writer derives the builder path from the exact workflow name declared in its
caller's `workflow_run.workflows`, read at the writer's default-branch revision.
A single GitHub query reads workflow definitions, so PR-controlled names cannot
expand the allowed builders. Missing or duplicate names and wildcard or multiple
filters fail closed. This replaces the repeated builder-path input while retaining
independent workflow identity validation.

Use GitHub's commit API with an expected head to reject stale writes atomically.
Only changed generated files, including additions and removals, enter one commit.
A repository-scoped CI bot App token triggers normal CI. Dependabot's preset adds
`[dependabot skip]`; Renovate uses its documented `gitIgnoredAuthors` integration
for the writer's verified email. A fixed generated-commit trailer prevents loops
when self-hosted Renovate and the writer share an App identity. Identical output
and stale runs do not write. Keep independent distribution checks and review.

Use `$/actions/action-distributions` in the reusable workflow. GitHub resolves it
to the workflow's own repository and immutable revision without a checkout, even
when another repository calls it. The hosted tests check out the same revision to
run the action's test package. This targets GitHub.com; self-repository action
references are unavailable on GitHub Enterprise Server.

## Workspace extension (2026-11-11)

The pnpm workspace consumer builds several action bundles from one root lockfile.
Its combined output exceeds the original 20 MiB serialized-artifact limit. This
extension supersedes the npm-only, single-output and disabled-hooks requirements
above for explicitly configured consumers; their defaults remain unchanged.

Use explicit newline-separated literal output directories relative to the build
root, not broad output globs or PR-provided manifests. The same trusted writer
inputs limit additions and deletions. Package-manager detection, version setup and command selection belong to
`ci-github-nodejs`; the distribution helper executes its detected commands for
each affected package. This replaces the initial workspace implementation's
custom manager selector and direct pnpm bootstrap. The shared setup configures
tooling without installing, because this workflow owns the per-package loop.
Apply the workflow's explicit Node version afterward; setup-node 3.0.0 has no
version override input. A root build runs once with a frozen pnpm lockfile. An opt-in enables lifecycle hooks only in the read-only builder; pnpm
retains its allowBuilds policy. No installation or package-manager bootstrap runs
in the writer.

Keep the 20 MiB default and bound opt-in artifacts at 128 MiB, 1,000 files and
50 MiB per file. Large changes upload individual Git blobs, create a tree based
on the expected parent's tree and create one child commit. GraphQL updateRefs
uses beforeOid and force: false for the final compare-and-swap. Failures leave
the branch unchanged, though uploaded unreachable Git objects can remain. This
preserves an atomic single-commit update without sending all file contents in
one GraphQL mutation. The Git Data API path does not provide the automatic
signature of createCommitOnBranch; consumers must check their signing rules.

Alternatives rejected: raising the JSON limit alone leaves one oversized commit
request; separate per-bundle commits expose partial rebuilds and trigger excess
CI; a normal non-forced ref update lacks an exact-head guard for branch rewinds.
Keep the current commit API for small changes. Keep the consumer's existing
bundle verification and real action integration tests.

## Automation alternatives

- Check-only workflows, as in GitHub's TypeScript template, leave manual rebuilding.
- Docker's same-job rebuild and push is smaller, but exposes write credentials in
  the job executing updated dependencies.
- A separate distribution PR after merging creates another review and permits
  source/distribution drift on the default branch.
- Copying the complete workflow to every repository duplicates security fixes.
- Release-only bundles would change the supported source refs and release model.

## Automation rollout

Consumers retain two event callers, App credential wiring and explicit workflow inputs.
Packages without committed bundles need no workflow. Build failures remain visible
and block merging through existing checks; automation does not bypass review.

The writer and its policy inputs must reach each default branch before automatic
writes can run. Common's shared implementation must be published before consumers can
adopt a stable release; PRs can validate immutable implementation commits first.
The App needs contents write, actions read and pull requests read for the selected
repository.
Hosted tests must validate action checkout, its public interface and consumer calls.
Actual Dependabot and Renovate updates after rollout must validate the event
handoff, App permissions, automatic CI retrigger and rebasing; local mocks cannot
establish those facts. Existing Renovate manager coverage is unchanged.

## Compatibility evidence

Probes on 2026-11-08 used the audited lockfiles and ncc 0.45.0. Build output was
copied outside the repositories, with no adjacent `node_modules`.

- Commitlint compiled but failed on import with `Cannot find module
'./commitlint.schema.json'`. Its conventional preset, custom presets, plugins
  and TypeScript configuration loading also need explicit compatibility coverage.
- The summarizer compiled, but invoking its real default LLM service failed with
  `Cannot find module '@langchain/openai'`. LangChain resolves `config.package`
  dynamically; its provider imports are absent from the generated distribution.
- Textlint compiled, but the action's default comments/terminology/Markdown
  configuration reported "No rules found". Bundling only its CLI omits the
  plugins and rules selected by configuration. Prettier and markdownlint's
  consumer-selected plugins and configuration need equivalent checks.
- Jampack's lockfile includes platform-selected esbuild and Sharp packages.
  A distribution built on one host does not establish support for another OS,
  CPU architecture or libc. No portable native bundle is claimed.

During the 2026-11-09 implementation review, actionlint 1.7.12 did not recognize
`job.workflow_repository` and `job.workflow_sha` used by an earlier hosted test.
The final test setup uses ordinary checkout and self-repository action references,
so that expression exception is no longer needed.

## Follow-up acceptance criteria

- [ ] Commitlint: package schema and the default preset, then verify JSON, CJS,
      ESM and TypeScript configuration, relative and installed presets, plugins,
      ignores, invalid configuration and missing dependencies without action-time npm.
- [ ] Summarizer: package all three supported providers while preserving model
      selection, configuration overrides, response parsing and retry behavior. Verify
      OpenAI, Anthropic and Google through local provider stubs with no credentials.
- [ ] Documentation: distribute default plugins and preserve caller configuration,
      rule and plugin discovery, fix behavior and generated-file results. Compare a
      bundle against a versioned tool image before changing runner requirements.
- [ ] Jampack: evaluate a versioned tool image or per-platform artifacts; declare
      supported OS/architecture/libc combinations, verify native binary provenance,
      and measure image/artifact transfer against installation and cache costs.

These are unfinished implementations, not exemptions from future optimization.
Do not remove working runtime setup until the relevant acceptance criteria pass.

## Consequences

Repository downloads grow with committed distributions. Measure bundle size and
local setup/startup separately; this audit does not establish end-to-end CI gains.
Dependency updates must rebuild output. Keep security analysis on maintained
sources and dependency review on lockfiles; generated exclusions must be scoped.

Consumers no longer copy a test runner or repeat distribution path lists. New
packages enter ordinary CI immediately and become eligible for automated writes
after their manifests reach the default branch. Callers can narrow selection
explicitly. Dependency installation continues to disable lifecycle scripts.

## References

- [ncc asset relocation caveat](https://github.com/vercel/ncc#caveats)
- [Release distributions decision](https://github.com/hoverkraft-tech/ci-github-publish/blob/perf/bundle-action-dependencies/docs/adr/0002-bundle-action-dependencies.md)
- [Chart distribution decision](https://github.com/hoverkraft-tech/ci-github-container/blob/perf/bundle-chart-release-dependencies/docs/adr/0002-bundle-chart-release-dependencies.md)

- [Official builder](https://github.com/actions/attest/blob/main/.github/workflows/rebuild-dist.yml)
- [Official writer](https://github.com/actions/attest/blob/main/.github/workflows/commit-dist.yml)
- [Artifact metadata vulnerability and correction](https://securitylab.github.com/advisories/GHSL-2026-225_actions_attest/)
- [Docker's same-PR automation](https://github.com/docker/build-push-action/blob/master/.github/workflows/update-dist.yml)
- [Dependabot generated-commit marker](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/manage-dependabot-prs)
- [Renovate generated-commit authors](https://docs.renovatebot.com/configuration-options/#gitignoredauthors)
- [GitHub token workflow triggers](https://docs.github.com/en/actions/concepts/security/github_token)
- [Reusable job identity](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context)
- [workflow_run branch and permission semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)
- [Self-repository action references](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#example-using-an-action-in-the-same-repository-as-the-workflow-at-the-running-commit-recommended)
