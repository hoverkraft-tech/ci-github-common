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

Follow the split-permission pattern in `actions/attest`. Implement one reusable
`action-distributions.yml` workflow and its tested helper in ci-github-common.
Each consumer keeps two small event wrappers and `.github/action-distributions.json`,
an explicit list of package directories. The distribution convention is `dist/`
and the build command is `npm run build`; existing package scripts own bundling
and license generation.

The `pull_request` wrapper rebuilds affected packages on same-repository Dependabot
updates, using the exact PR head and a read-only token without secrets. It installs
locked dependencies with lifecycle scripts disabled and uploads generated file
bytes as an artifact. Grouped updates produce one artifact. No runtime or
development dependency classification is needed: lockfile-only and bundler
updates are covered by the changed package paths.

The `workflow_run` wrapper invokes the writer from the default branch. The writer
checks the successful originating workflow, repository, Dependabot actor, branch,
open PR and current head against GitHub metadata. It reads the package allowlist
from the default branch. Artifact data cannot select the destination branch or
expand the allowed paths. The writer never checks out or executes PR code.

Use GitHub's commit API with an expected head to atomically reject stale writes.
Only changed distribution files, including additions and removals, enter one
commit. A repository-scoped CI bot App token triggers normal CI on that commit.
The message includes `[dependabot skip]` so Dependabot can rebase over generated
commits and trigger a fresh rebuild. Identical output and stale runs do not write.
Keep independent distribution checks and normal review requirements.

Check out the shared helper using the reusable job's own repository and SHA;
consumers pin that workflow to an immutable commit. This targets GitHub.com,
where `job.workflow_repository` and `job.workflow_sha` are supported.
The current actionlint 1.7.12 release does not recognize those fields. Limit its
exception to these two properties in the shared workflow and its hosted test;
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

Consumers retain only event routing, App credential wiring and package selection.
Packages without committed bundles need no workflow. Build failures remain visible
and block merging through existing checks; automation does not bypass review.

The writer and allowlist must reach each default branch before automatic writes
can run. Common's shared implementation must be published before consumers can
adopt a stable release; PRs can validate immutable implementation commits first.
The App needs contents write and pull requests read for the selected repository.
Hosted tests must validate reusable helper checkout and both consumer call sites.
An actual Dependabot update after rollout must validate the event handoff, App
permissions and automatic CI retrigger; local mocks cannot establish those facts.

## References

- [Official builder](https://github.com/actions/attest/blob/main/.github/workflows/rebuild-dist.yml)
- [Official writer](https://github.com/actions/attest/blob/main/.github/workflows/commit-dist.yml)
- [Artifact metadata vulnerability and correction](https://securitylab.github.com/advisories/GHSL-2026-225_actions_attest/)
- [Docker's same-PR automation](https://github.com/docker/build-push-action/blob/master/.github/workflows/update-dist.yml)
- [Dependabot generated-commit marker](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/manage-dependabot-prs)
- [GitHub token workflow triggers](https://docs.github.com/en/actions/concepts/security/github_token)
- [Reusable job identity](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context)
