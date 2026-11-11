<!-- header:start -->

# GitHub Reusable Workflow: Action distributions

<div align="center">
  <img src="../logo.svg" width="60px" align="center" alt="Action distributions" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common)](https://github.com/hoverkraft-tech/ci-github-common/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-common)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-common?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Rebuild committed Node.js bundles in the same dependency PR through one reusable
workflow with separate build and writer event callers. Configure workflow inputs;
no repository configuration file is needed. The dedicated
[action](../../actions/action-distributions/README.md) owns the implementation and
tests. Existing CI must check bundle consistency before merging.

### Configure a repository

1. Each package needs a lockfile and build and check:dist scripts. Defaults use Node.js 24,
   `npm ci --ignore-scripts`, `npm run build`, and `dist/index.js` plus `dist/licenses.txt`.
   For pnpm workspaces, select the root working directory, commit pnpm-lock.yaml
   and pin packageManager in the root package.json. Shared ci-github-nodejs actions
   detect and configure the package manager from the first affected package. Installation
   uses `pnpm install --frozen-lockfile`. Set ignore-scripts to false when approved
   hooks are required; pnpm's allowBuilds policy still applies. Only the read-only
   builder installs dependencies or executes repository scripts. All selected packages
   must use the same package manager. The shared setup configures tooling only;
   the builder installs once per affected package using the shared detected command.
   The node-version input is applied after setup to preserve the requested runtime.
2. Copy the [build caller](https://github.com/hoverkraft-tech/ci-github-common/blob/main/.github/workflows/__rebuild-action-distributions.yml) and
   [writer caller](https://github.com/hoverkraft-tech/ci-github-common/blob/main/.github/workflows/__commit-action-distributions.yml). Both call
   `hoverkraft-tech/ci-github-common/.github/workflows/action-distributions.yml`
   pinned to the same reviewed commit. Configure author rules in both callers; package directories are discovered
   automatically. Repeat other shared settings when overriding defaults.
3. Set `workflow_run.workflows` to the build caller's unique, exact `name`
   and `pull_request.branches` to the default branch. GitHub rejects a workflow
   listening to its own completion, so the two small event callers are required
   even though they share one reusable workflow.
4. Provide `CI_BOT_APP_CLIENT_ID` as a repository variable and
   `CI_BOT_APP_PRIVATE_KEY` as an Actions secret. Install the App with contents
   write, actions read and pull requests read on the consumer repository. Only
   the writer caller passes the App key; the build caller passes no secrets.
5. Merge the callers into the default branch. Trigger a fresh dependency update
   to verify regeneration, CI on the generated commit and bot rebasing.
   GitHub.com is required for self-repository action references.

The generated Usage block lists inputs. Actual execution requires both events in
the linked callers; a push-only caller does not run either job. To customize the
build, set `build-script` to a package script name and choose `node-version`. Override
`output-directory`, `required-files`, `artifact-name`, `retention-days` or
`commit-message` when needed. A workspace build can emit several bundles: supply
newline-separated literal output-directory paths relative to the workspace root.
Required files must exist in every output directory; glob output paths are rejected.
Keep these paths and the max-artifact-size limit identical in both callers.

By default, discover root and `actions/**` packages declaring the selected build
script and check:dist. Override working-directories with newline-separated
literal directories or glob patterns (`*`, `**`, `?`). Literal directories explicitly
define the allowlist; glob matches must declare both scripts. No matches is a
successful no-op. Dependency, generated and hidden directories are excluded.
Selected directories must not overlap or contain traversal components.

Build and writer discovery read manifests from the PR's default-branch base
revision through GitHub's API. No repository code is executed during discovery.
A newly introduced package must reach the default branch before automated
rebuilds can write its output; normal distribution CI tests it on the PR.
An empty required-files accepts any nonempty output for each affected package.
The writer uses its own default-branch inputs and manifests as the allowlist.
A PR cannot expand its write scope by editing inputs or package manifests.

### Choose allowed PR authors

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
[gitIgnoredAuthors](https://docs.renovatebot.com/configuration-options/#gitignoredauthors)
in its existing configuration; otherwise Renovate can treat the generated commit
as a manual modification and stop updating that PR. The common and container
repositories configure `128996893+hoverkraft-bot[bot]@users.noreply.github.com`.
Other installations must use their own writer's email.

Every generated commit includes a fixed body trailer. The helper skips that head
on subsequent events, including when Renovate and the writer use the same App.
Normal CI still runs; no CI skip marker or automatic merge is configured.

### Build and publication behavior

The builder checks out the exact PR head and rebuilds affected configured packages,
including grouped updates and lockfile-only changes. Generated files and licenses
are uploaded together. Updated dependencies execute only in this read-only job.

The writer checks the originating run and current PR through GitHub's API. It
accepts only the current successful attempt, the resolved builder and configured author,
a same-repository branch, and an unchanged open PR targeting the default branch.
It treats the artifact as bytes, validates every path, and commits only changes
inside the selected output directories. Deleted chunks are removed; unrelated
files remain untouched. It never checks out or executes PR code. These origin and
head checks cannot be disabled through inputs.

The writer resolves its caller file through GitHub, then reads the workflow
definitions at its default-branch revision. Its workflow_run.workflows filter
must contain one exact name matching one pull_request workflow in that snapshot.
Missing or duplicate names, multiple names and wildcard filters fail publication.
The originating run must belong to that workflow path; a name supplied by a PR
or the run is never used to authorize publication. No builder-path input is needed.

One generated commit covers all affected packages. The App token triggers normal
CI. Identical output and superseded runs produce no commit. Publication is
serialized per branch and checks the expected head atomically. A concurrent update
fails publication without a force push.

### Troubleshooting

- A failed build leaves the PR unchanged. Fix its package build; existing
  distribution checks continue to prevent stale merges.
- Missing or expired artifacts fail publication. Retention defaults to one day;
  rerun the builder to produce a new attempt, then inspect the writer run.
- A moved or closed PR is skipped. A new bot update rebuilds the latest head; a
  failed atomic write never replaces newer commits.
- Token creation or commit failures require checking the App installation,
  permissions, repository rules and Actions secret. No PAT fallback is used.
- Artifacts default to a 20 MiB JSON limit; max-artifact-size can raise it to 128 MiB.
  Keep output below 1,000 regular files and each file below 50 MiB. Symbolic links,
  executable distribution files and truncated GitHub tree/file listings are rejected.
- Changes above 20 MiB use individual Git blob uploads and one Git commit, followed
  by a non-forced atomic update guarded by the expected head. Unlike the small-change
  commit API, this path does not automatically sign the commit. Repositories requiring
  signed bot commits must account for this before enabling large artifacts.

See [ADR 0002](../../docs/adr/0002-audit-action-dependency-distributions.md) for the design,
alternatives and rollout constraints.

### Permissions

- **`actions`**: `read`
- **`contents`**: `read`
- **`pull-requests`**: `read`

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
name: Action distributions
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  action-distributions:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/action-distributions.yml@66882b24f9f13e45a6541896a5a7c638cb91c94c # 4.0.0
    permissions:
      actions: read
      contents: read
      pull-requests: read
    secrets:
      # GitHub App private key, passed only by the trusted workflow_run caller.
      github-app-key: ""
    with:
      # Newline-separated package directories or glob patterns (`*`, `**`, `?`). Empty discovers root and `actions/**` packages declaring build and check:dist scripts.
      working-directories: ""

      # Newline-separated generated directories relative to each package. Only files inside these literal, non-overlapping directories may be committed.
      # Default: `dist`
      output-directory: dist

      # Newline-separated files required in every generated directory. Empty accepts any nonempty output.
      # Default: `index.js
      # licenses.txt
      # `
      required-files: |
        index.js
        licenses.txt

      # JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.
      # Default: `["dependabot","renovate"]`
      pull-request-authors: '["dependabot","renovate"]'

      # Artifact name prefix shared by build and commit. The run attempt is appended automatically.
      # Default: `action-distributions`
      artifact-name: action-distributions

      # Node.js version used for dependency installation and the build script.
      # Default: `24`
      node-version: "24"

      # Package script name to run after a locked dependency installation.
      # Default: `build`
      build-script: build

      # Disable install lifecycle scripts. Set false only when the read-only builder needs approved hooks.
      # Default: `true`
      ignore-scripts: true

      # Maximum serialized artifact size in MiB (integer from 1 to 128). Use the same limit for build and writer.
      # Default: `20`
      max-artifact-size: 20

      # Artifact retention in days, within the repository's artifact policy.
      # Default: `1`
      retention-days: 1

      # Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.
      # Default: `build: regenerate action distributions`
      commit-message: "build: regenerate action distributions"

      # Client ID of the GitHub App installed on the caller repository with contents write and actions and pull requests read access.
      github-app-client-id: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                  | **Description**                                                                                                                                                 | **Required** | **Type**    | **Default**                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| **`working-directories`**  | Newline-separated package directories or glob patterns (`*`, `**`, `?`). Empty discovers root and `actions/**` packages declaring build and check:dist scripts. | **false**    | **string**  | -                                                                                                 |
| **`output-directory`**     | Newline-separated generated directories relative to each package. Only files inside these literal, non-overlapping directories may be committed.                | **false**    | **string**  | `dist`                                                                                            |
| **`required-files`**       | Newline-separated files required in every generated directory. Empty accepts any nonempty output.                                                               | **false**    | **string**  | <!-- textlint-disable --><pre lang="text">index.js&#13;licenses.txt</pre><!-- textlint-enable --> |
| **`pull-request-authors`** | JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.                   | **false**    | **string**  | `["dependabot","renovate"]`                                                                       |
| **`artifact-name`**        | Artifact name prefix shared by build and commit. The run attempt is appended automatically.                                                                     | **false**    | **string**  | `action-distributions`                                                                            |
| **`node-version`**         | Node.js version used for dependency installation and the build script.                                                                                          | **false**    | **string**  | `24`                                                                                              |
| **`build-script`**         | Package script name to run after a locked dependency installation.                                                                                              | **false**    | **string**  | `build`                                                                                           |
| **`ignore-scripts`**       | Disable install lifecycle scripts. Set false only when the read-only builder needs approved hooks.                                                              | **false**    | **boolean** | `true`                                                                                            |
| **`max-artifact-size`**    | Maximum serialized artifact size in MiB (integer from 1 to 128). Use the same limit for build and writer.                                                       | **false**    | **number**  | `20`                                                                                              |
| **`retention-days`**       | Artifact retention in days, within the repository's artifact policy.                                                                                            | **false**    | **number**  | `1`                                                                                               |
| **`commit-message`**       | Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.                                                               | **false**    | **string**  | `build: regenerate action distributions`                                                          |
| **`github-app-client-id`** | Client ID of the GitHub App installed on the caller repository with contents write and actions and pull requests read access.                                   | **false**    | **string**  | -                                                                                                 |

<!-- inputs:end -->
<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                                         | **Required** |
| -------------------- | ----------------------------------------------------------------------- | ------------ |
| **`github-app-key`** | GitHub App private key, passed only by the trusted workflow_run caller. | **false**    |

<!-- secrets:end -->
<!-- outputs:start -->
<!-- outputs:end -->
<!-- examples:start -->
<!-- examples:end -->
<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-common/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2026 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
