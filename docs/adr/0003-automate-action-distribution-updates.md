# Automate action distribution updates

Date: 2026-11-08

Status: Proposed

## Context

Committed action distributions remove runtime installation, but Dependabot only
updates dependency manifests and lockfiles. Requiring maintainers to rebuild each
update would transfer the runtime savings into recurring maintenance work.

Common, publish and container now own bundles. Their rebuilding and publication
rules should have one implementation, including the security checks.

## Decision

Follow the split-permission pattern in `actions/attest`. Expose two public reusable
workflows in ci-github-common: `build-action-distributions.yml` and
`commit-action-distributions.yml`, backed by one tested implementation. The build
workflow declares no secrets; only the writer accepts the App credential.

Use workflow inputs only. Both callers explicitly pass working directories,
output directory, required files and allowed PR authors. Build inputs also select
the npm script, Node.js version, artifact name and retention; writer inputs select
the originating workflow path, artifact name, commit headline and App identity.
Repeating the shared settings in the two callers keeps configuration explicit
and avoids a separate configuration format. Callers choose their event workflow names and filenames; no fixed private
wrapper filename is part of the public API. Defaults keep ordinary bundles concise.
Support Dependabot and hosted Renovate presets, plus explicit login/ID and optional
branch-prefix rules for custom automation accounts. Common and container use
`hoverkraft-bot[bot]` for self-hosted Renovate, so checking only `renovate[bot]` is
insufficient. The PR author and originating actor must match the configured rule;
a branch prefix or label alone never authorizes a write.

The `pull_request` builder uses its caller inputs and builds the exact PR head
without write credentials. It installs locked dependencies with
lifecycle scripts disabled. Grouped, lockfile-only and build-tool updates produce
one artifact. Each package's existing script owns bundling and license generation.

The `workflow_run` writer validates GitHub-provided run metadata, the configured
originating workflow, repository, author, actor, branch and unchanged open PR. Its
policy inputs come from the trusted default-branch caller. The artifact contains
file bytes only and cannot select the branch or expand the allowed output paths. The writer
never checks out or executes PR code. Origin checks and atomic head validation are
mandatory and have no disable switch.

Use GitHub's commit API with an expected head to reject stale writes atomically.
Only changed generated files, including additions and removals, enter one commit.
A repository-scoped CI bot App token triggers normal CI. Dependabot's preset adds
`[dependabot skip]`; Renovate uses its documented `gitIgnoredAuthors` integration
for the writer's verified email. A fixed generated-commit trailer prevents loops
when self-hosted Renovate and the writer share an App identity. Identical output
and stale runs do not write. Keep independent distribution checks and review.

Check out the shared helper using the reusable job's own repository and SHA;
consumers pin that workflow to an immutable commit. This targets GitHub.com,
where `job.workflow_repository` and `job.workflow_sha` are supported.
The current actionlint 1.7.12 release does not recognize those fields. Limit its
exception to these two properties in the shared workflows and their hosted test;
keep all other expression and security checks enabled.

## Alternatives

- Check-only workflows, as in GitHub's TypeScript template, leave manual rebuilding.
- Docker's same-job rebuild and push is smaller, but exposes write credentials in
  the job executing updated dependencies.
- A separate distribution PR after merging creates another review and permits
  source/distribution drift on the default branch.
- Copying the two complete workflows to every repository duplicates security fixes.
- Release-only bundles would change the supported source refs and release model.

## Consequences and rollout

Consumers retain event routing, App credential wiring and explicit workflow inputs.
Packages without committed bundles need no workflow. Build failures remain visible
and block merging through existing checks; automation does not bypass review.

The writer and its policy inputs must reach each default branch before automatic
writes can run. Common's shared implementation must be published before consumers can
adopt a stable release; PRs can validate immutable implementation commits first.
The App needs contents write, actions read and pull requests read for the selected
repository.
Hosted tests must validate reusable helper checkout and both consumer call sites.
Actual Dependabot and Renovate updates after rollout must validate the event
handoff, App permissions, automatic CI retrigger and rebasing; local mocks cannot
establish those facts. Existing Renovate manager coverage is unchanged.

## References

- [Official builder](https://github.com/actions/attest/blob/main/.github/workflows/rebuild-dist.yml)
- [Official writer](https://github.com/actions/attest/blob/main/.github/workflows/commit-dist.yml)
- [Artifact metadata vulnerability and correction](https://securitylab.github.com/advisories/GHSL-2026-225_actions_attest/)
- [Docker's same-PR automation](https://github.com/docker/build-push-action/blob/master/.github/workflows/update-dist.yml)
- [Dependabot generated-commit marker](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/manage-dependabot-prs)
- [Renovate generated-commit authors](https://docs.renovatebot.com/configuration-options/#gitignoredauthors)
- [GitHub token workflow triggers](https://docs.github.com/en/actions/concepts/security/github_token)
- [Reusable job identity](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context)
