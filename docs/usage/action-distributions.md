# Automatic action distribution updates

Use the [action distributions workflow](../../.github/workflows/action-distributions.yml)
to rebuild committed Node.js bundles in the same Dependabot PR. Existing CI must
check distribution consistency and test the generated code before merging.

## Configure a repository

1. Add `.github/action-distributions.json` containing the package directories that
   own committed bundles, for example:

   ```json
   ["actions/release/get-configuration", "actions/release/prepare"]
   ```

2. Each package must have a lockfile and an `npm run build` script producing
   `dist/index.js`, `dist/licenses.txt` and any additional distribution files.
   Builds use Node.js 24 and `npm ci --ignore-scripts`; packages requiring install
   lifecycle scripts are outside this workflow's contract.
3. Copy the two event wrappers
   [rebuild](../../.github/workflows/__rebuild-action-distributions.yml) and
   [commit](../../.github/workflows/__commit-action-distributions.yml), preserving
   their filenames and the rebuild workflow's name. Replace their `uses` values
   with `hoverkraft-tech/ci-github-common/.github/workflows/action-distributions.yml`
   pinned to the same reviewed commit. Adjust the PR base branch if necessary.
4. Provide `CI_BOT_APP_CLIENT_ID` as a repository variable and
   `CI_BOT_APP_PRIVATE_KEY` as an Actions secret. Install the App on the consumer
   repository with contents write, actions read and pull requests read. Only the
   commit wrapper passes the secret; the rebuild wrapper must pass none.
5. Merge the configuration and wrappers into the default branch. Trigger a fresh
   Dependabot update to verify regeneration and CI on the generated commit.

The package list is read from the default branch. A PR cannot authorize additional
write paths by editing that list. Packages without committed bundles do not need
to adopt this workflow. GitHub.com is required for reusable job identity contexts.

## Behavior

The builder runs for same-repository Dependabot PRs. It checks out the exact PR
head and rebuilds affected configured packages, including grouped updates and
lockfile-only changes. Bundles and licenses are uploaded together. Updated
dependencies execute only in this read-only job, which receives no App secret.

The writer checks the originating run and current PR through GitHub's API. It
accepts only the current successful attempt, the configured builder, a Dependabot
branch in the same repository and an unchanged open PR targeting the default
branch. It treats the artifact as file bytes, validates every path, and commits
only changes inside the selected `dist` directories. Deleted chunks are removed;
unrelated files remain untouched. The writer never executes or checks out PR code.

One generated commit covers all affected packages. Its `[dependabot skip]` marker
lets Dependabot rebase over it. The App token triggers normal CI; no automatic
merge or CI bypass is configured. Identical output and superseded runs do not
produce commits. Publication is serialized per branch and checks the expected
head atomically. A concurrent update causes the commit to fail without a force push.

## Troubleshooting

- A failed build leaves the PR unchanged. Inspect the rebuild job and fix its
  package build; existing distribution checks continue to prevent stale merges.
- Missing or expired artifacts fail publication. Artifacts are retained for one
  day; rerun the builder to produce a new attempt, then inspect the writer run.
- A moved or closed PR is skipped. A new Dependabot update rebuilds the latest
  head; a failed atomic write never replaces newer commits.
- Token creation or commit failures require checking the App installation,
  permissions, repository rules and Actions secret. No PAT fallback is used.
- Keep generated output below 20 MiB of JSON and 1,000 regular files. Symbolic
  links, executable distribution files and truncated GitHub tree/file listings
  are rejected. Large/native distributions need a separate reviewed design.

See [ADR 0003](../adr/0003-automate-action-distribution-updates.md) for the design,
alternatives and rollout constraints.
