# Continuous Integration - GitHub - Common

<div align="center">
 <img src=".github/logo.svg" width="60px" align="center" alt="Logo for Continuous Integration - GitHub - Common" />
</div>

---

![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)
[![Continuous Integration](https://github.com/hoverkraft-tech/ci-github-common/actions/workflows/__main-ci.yml/badge.svg)](https://github.com/hoverkraft-tech/ci-github-common/actions/workflows/__main-ci.yml)
[![GitHub tag](https://img.shields.io/github/tag/hoverkraft-tech/ci-github-common?include_prereleases=&sort=semver&color=blue)](https://github.com/hoverkraft-tech/ci-github-common/releases/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Overview

Opinionated GitHub Actions and reusable workflows for foundational continuous-integration automation that can be shared across Hoverkraft projects.

## Actions

### Workflow & repository automation

- [Checkout](actions/checkout/README.md) - event-aware drop-in replacement for `actions/checkout` that supports issue comment triggers.
- [Create and merge pull request](actions/create-and-merge-pull-request/README.md) - opens a pull request, rebases, and merges it with the GitHub Actions bot identity.
- [Create or update comment](actions/create-or-update-comment/README.md) - adds or updates comments on issues and pull requests idempotently.
- [Get GitHub Actions bot user](actions/get-github-actions-bot-user/README.md) - retrieves the profile information for the GitHub Actions bot.
- [Get issue number](actions/get-issue-number/README.md) - extracts the relevant issue number from the current workflow context.

### Matrix & workflow data helpers

- [Get matrix outputs](actions/get-matrix-outputs/README.md) - aggregates outputs across matrix jobs for downstream steps.
- [Set matrix output](actions/set-matrix-output/README.md) - writes structured outputs that can be consumed by other matrix jobs.
- [Local workflow actions](actions/local-workflow-actions/README.md) - loads reusable workflow actions from the current repository.

### Repository insights & utilities

- [Parse CI reports](actions/parse-ci-reports/README.md) - parses CI reports (tests, linting, coverage) into GitHub summaries and Markdown for PR comments.
- [Repository owner is organization](actions/repository-owner-is-organization/README.md) - checks whether the repository owner is an organization.
- [Working directory](actions/working-directory/README.md) - resolves and validates a working directory path as an absolute path.
- [Slugify](actions/slugify/README.md) - converts free-form strings into GitHub-friendly slugs.

## Reusable Workflows

### Community & issue hygiene

- [Greetings](.github/workflows/greetings.md) - welcomes first-time issue reporters and pull request authors.
- [Need fix to Issue](.github/workflows/need-fix-to-issue.md) - labels issues that require follow-up fixes.
- [Stale](.github/workflows/stale.md) - automatically marks and closes stale issues and pull requests.

### Quality gates

- [Linter](.github/workflows/linter.md) - runs Super Linter and shared formatting checks across the repository.
- [Semantic pull request](.github/workflows/semantic-pull-request.md) - enforces semantic pull request titles before merging.

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-publish/blob/main/CONTRIBUTING.md) for more details.

### Action structure pattern

All actions follow a consistent structure:

```text
actions/{action-name}/
├── action.yml        # Action definition with inputs/outputs
├── README.md         # Usage documentation (auto-generated by CI Dokumentor)
└── *.js/other files  # Optional helper scripts or assets
```

### Development standards

1. **Pinned dependencies** - reference external actions by commit SHA (for example `actions/checkout@08c6903c…`).
2. **Composite-first** - encapsulate logic in composite actions and keep scripts minimal.
3. **Early validation** - validate inputs up front using GitHub Script or shell guards and fail fast with helpful messages.
4. **Consistent branding** - set `author: hoverkraft` and `branding.color: blue` with an appropriate icon in every `action.yml`.

## Development Workflow

```bash
make lint        # Run Super Linter (dockerized)
make lint-fix    # Run Super Linter with autofix enabled
gh act -W .github/workflows/<workflow>.yml  # Exercise workflows locally when needed
```

## File Structure

```text
actions/                      # Composite GitHub Actions
.github/workflows/            # Reusable workflows (.yml) with accompanying docs (.md)
Dockerfile                    # Super Linter container definition
Makefile                      # Lint helpers
```

## Author

🏢 **Hoverkraft**

- Site: [https://hoverkraft.cloud](https://hoverkraft.cloud)
- GitHub: [@hoverkraft-tech](https://github.com/hoverkraft-tech)

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2025 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).
