# Releases

The repository uses the shared Hoverkraft release actions to calculate versions,
publish GitHub releases, and generate release summaries.

## Release preparation

[Prepare release](../../.github/workflows/__prepare-release.yml) runs on pushes to
`main` and when pull requests targeting `main` are opened, reopened, updated, or
edited. It applies the shared Conventional Commit labels to pull requests.

The shared release configuration increments the major version for breaking
changes, the minor version for features, and the patch version for other changes.
Tags use the existing `MAJOR.MINOR.PATCH` format. No repository override is needed
for these defaults.

## Publishing

[Release](../../.github/workflows/__release.yml) runs every Monday at 08:25 UTC and
supports manual dispatch. It runs only on the default branch and:

1. Runs the shared CI workflow.
2. Plans a release for the exact commit validated by CI.
3. Creates and publishes the release when relevant changes exist and a tag was
   planned. Release notes include a generated summary.

Failed or skipped CI prevents publication. Concurrent release runs are serialized.
The GitHub App token lets the new tag trigger
[main CI](../../.github/workflows/__main-ci.yml), which regenerates action and
workflow documentation and sends its artifact to the public documentation site.

Documentation pull requests use squash merging so GitHub signs the resulting
commit to satisfy the default branch's signature requirement. The pull request
commits must also be signed and verified. Keep squash merging enabled in the
repository settings; GitHub cannot sign commits rewritten by a rebase merge.

To release manually, open **Actions → Internal - Release → Run workflow** and
select `main`. Leave `force` disabled for normal releases. Enable it only to bypass
the no-changes check; the default-branch restriction, CI checks, and planned-tag
requirement still apply.

## Credentials

The workflow uses repository or inherited organization settings:

| Setting                  | Kind     | Purpose                                                                         |
| ------------------------ | -------- | ------------------------------------------------------------------------------- |
| `CI_BOT_APP_CLIENT_ID`   | Variable | Identify the installed CI bot GitHub App.                                       |
| `CI_BOT_APP_PRIVATE_KEY` | Secret   | Create an installation token with Contents write and Pull requests read access. |
| `OPENAI_API_KEY`         | Secret   | Generate the release summary.                                                   |

The GitHub App must be installed on this repository and allowed to create release
tags. Keep these settings available to the repository before enabling scheduled
releases.
