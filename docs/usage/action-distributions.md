# Automatic action distribution updates

Use [build-action-distributions](../../.github/workflows/build-action-distributions.yml)
and [commit-action-distributions](../../.github/workflows/commit-action-distributions.yml)
to regenerate committed Node.js bundles in the same dependency PR. Configure both
workflows through inputs; no repository configuration file is needed. Existing CI
must check distribution consistency and test the generated code before merging.

## Configure a repository

1. Each package needs a lockfile and an npm build script. Defaults use Node.js 24,
   `npm run build`, and `dist/index.js` plus `dist/licenses.txt`. Dependency
   installation uses `npm ci --ignore-scripts`; packages requiring install
   lifecycle scripts are outside this contract.
2. Copy the two small event wrappers:
   [build](../../.github/workflows/__rebuild-action-distributions.yml) and
   [commit](../../.github/workflows/__commit-action-distributions.yml). Replace their
   `uses` values with the corresponding public workflow in
   `hoverkraft-tech/ci-github-common`, pinned to the same reviewed commit.
3. Set `working-directories` and `pull-request-authors` in both callers. Keep
   `output-directory`, `required-files` and `artifact-name` identical if overriding
   their defaults. A root package uses `working-directories: .`; multiple packages
   use a newline-separated list. Directory lists must not overlap. Paths are
   relative, contain only letters, numbers, underscores, hyphens and dots within
   components, and cannot contain hidden or traversal components.
4. Set the writer's `build-workflow` to the builder caller's repository-relative
   path. Its `workflow_run.workflows` trigger must match that caller's `name`.
   Callers can choose their own filenames and names. Adjust the PR base branch to
   the repository's default branch.
5. Provide `CI_BOT_APP_CLIENT_ID` as a repository variable and
   `CI_BOT_APP_PRIVATE_KEY` as an Actions secret. Install the App on the repository
   with contents write, actions read and pull requests read. Only the writer
   passes the secret; the builder must pass none.
6. Merge the callers into the default branch. Trigger a fresh dependency update
   to verify regeneration, CI on the generated commit and subsequent bot rebasing.

The workflow metadata documents every input. The builder additionally accepts
`build-script` (an npm script name), `node-version` and `retention-days`. The writer
accepts `commit-message` and the App credential. Defaults fit ordinary ncc bundles;
for example, an existing custom build can use these inputs:

```yaml
working-directories: |
  actions/example
  actions/another
output-directory: bundle
required-files: |
  main.cjs
  NOTICE
artifact-name: action-bundles
```

Set `build-script: bundle:ci` only in the builder if that is the packages' script.
An empty `required-files` accepts any nonempty output for each selected package.
The writer uses its own default-branch caller inputs as the allowlist. Changing
builder inputs in a PR cannot expand what the writer may commit. GitHub.com is
required for reusable job identity contexts.

## Choose allowed PR authors

`pull-request-authors` is a JSON array. It defaults to `["dependabot","renovate"]`,
which selects GitHub Dependabot and the hosted Renovate App. Both presets check
the PR creator and event actor by login and numeric account ID, with the respective
`dependabot/` and `renovate/` branch prefixes. Other PRs are skipped before any
package code executes.

For self-hosted Renovate or another automation account, pass an explicit rule in
both callers. For example, the Hoverkraft callers add their own App:

```yaml
pull-request-authors: |
  ["dependabot", "renovate", {"login":"hoverkraft-bot[bot]","id":128996893,"branch-prefix":"renovate/"}]
```

Verify an account's ID with `gh api 'users/ACCOUNT_LOGIN' --jq .id`. Custom rules
require `login` and numeric `id`; `branch-prefix` and `commit-message-suffix` are
optional. Authorizing a branch prefix alone is insufficient. Inputs do not enable
or extend a dependency updater's package-manager coverage.

Dependabot's preset adds `[dependabot skip]` to generated commits so it can rebase
over them. For Renovate, add the writer's actual commit author email to
[`gitIgnoredAuthors`](https://docs.renovatebot.com/configuration-options/#gitignoredauthors)
in its existing configuration; otherwise Renovate can treat the generated commit
as a manual modification and stop updating that PR. The common and container
repositories configure `128996893+hoverkraft-bot[bot]@users.noreply.github.com`.
Other installations must use their own writer's email.

Every generated commit includes a fixed body trailer. The helper skips that head
on subsequent events, including when Renovate and the writer use the same App.
Normal CI still runs; no CI skip marker or automatic merge is configured.

## Build and publication behavior

The builder checks out the exact PR head and rebuilds affected configured packages,
including grouped updates and lockfile-only changes. Generated files and licenses
are uploaded together. Updated dependencies execute only in this read-only job.

The writer checks the originating run and current PR through GitHub's API. It
accepts only the current successful attempt, the configured builder and author,
a same-repository branch, and an unchanged open PR targeting the default branch.
It treats the artifact as bytes, validates every path, and commits only changes
inside the selected output directories. Deleted chunks are removed; unrelated
files remain untouched. It never checks out or executes PR code. These origin and
head checks cannot be disabled through inputs.

One generated commit covers all affected packages. The App token triggers normal
CI. Identical output and superseded runs produce no commit. Publication is
serialized per branch and checks the expected head atomically. A concurrent update
fails publication without a force push.

## Troubleshooting

- A failed build leaves the PR unchanged. Fix its package build; existing
  distribution checks continue to prevent stale merges.
- Missing or expired artifacts fail publication. Retention defaults to one day;
  rerun the builder to produce a new attempt, then inspect the writer run.
- A moved or closed PR is skipped. A new bot update rebuilds the latest head; a
  failed atomic write never replaces newer commits.
- Token creation or commit failures require checking the App installation,
  permissions, repository rules and Actions secret. No PAT fallback is used.
- Keep generated output below 20 MiB of JSON and 1,000 regular files. Symbolic
  links, executable distribution files and truncated GitHub tree/file listings
  are rejected. Large/native distributions need a separate reviewed design.

See [ADR 0003](../adr/0003-automate-action-distribution-updates.md) for the design,
alternatives and rollout constraints.
