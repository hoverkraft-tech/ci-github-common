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

<!-- badges:end -->
<!-- overview:start -->

## Overview

Rebuild committed Node.js bundles in the same dependency PR through one reusable
workflow with separate build and writer event callers. Configure workflow inputs;
no repository configuration file is needed. The dedicated
[action](../../actions/action-distributions/README.md) owns the implementation and
tests. Existing CI must check bundle consistency before merging.

### Configure a repository

1. Each package needs a lockfile and npm build and check:dist scripts. Defaults use Node.js 24,
   `npm run build`, and `dist/index.js` plus `dist/licenses.txt`. Dependency
   installation uses `npm ci --ignore-scripts`; packages requiring install
   lifecycle scripts are outside this contract.
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
build, set `build-script` to an npm script name and choose `node-version`. Override
`output-directory`, `required-files`, `artifact-name`, `retention-days` or
`commit-message` when needed.

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
- Keep generated output below 20 MiB of JSON and 1,000 regular files. Symbolic
  links, executable distribution files and truncated GitHub tree/file listings
  are rejected. Large/native distributions need a separate reviewed design.

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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/action-distributions.yml@ce885f8dd6bf7191a79e3eebdf37bca805d40932 # 3.0.0
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

      # Generated directory relative to each package. Only files inside it may be committed.
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

      # Node.js version used for npm install and the build script.
      # Default: `24`
      node-version: "24"

      # npm script name to run after npm ci with dependency lifecycle scripts disabled.
      # Default: `build`
      build-script: build

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

| **Input**                  | **Description**                                                                                                                                                 | **Required** | **Type**   | **Default**                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **`working-directories`**  | Newline-separated package directories or glob patterns (`*`, `**`, `?`). Empty discovers root and `actions/**` packages declaring build and check:dist scripts. | **false**    | **string** | -                                                                                                 |
| **`output-directory`**     | Generated directory relative to each package. Only files inside it may be committed.                                                                            | **false**    | **string** | `dist`                                                                                            |
| **`required-files`**       | Newline-separated files required in every generated directory. Empty accepts any nonempty output.                                                               | **false**    | **string** | <!-- textlint-disable --><pre lang="text">index.js&#13;licenses.txt</pre><!-- textlint-enable --> |
| **`pull-request-authors`** | JSON array of dependabot or renovate presets, or objects with login, numeric account ID and optional branch-prefix and commit-message-suffix.                   | **false**    | **string** | `["dependabot","renovate"]`                                                                       |
| **`artifact-name`**        | Artifact name prefix shared by build and commit. The run attempt is appended automatically.                                                                     | **false**    | **string** | `action-distributions`                                                                            |
| **`node-version`**         | Node.js version used for npm install and the build script.                                                                                                      | **false**    | **string** | `24`                                                                                              |
| **`build-script`**         | npm script name to run after npm ci with dependency lifecycle scripts disabled.                                                                                 | **false**    | **string** | `build`                                                                                           |
| **`retention-days`**       | Artifact retention in days, within the repository's artifact policy.                                                                                            | **false**    | **number** | `1`                                                                                               |
| **`commit-message`**       | Single-line commit headline. Per-author suffixes and a loop-prevention body trailer are appended.                                                               | **false**    | **string** | `build: regenerate action distributions`                                                          |
| **`github-app-client-id`** | Client ID of the GitHub App installed on the caller repository with contents write and actions and pull requests read access.                                   | **false**    | **string** | -                                                                                                 |

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
