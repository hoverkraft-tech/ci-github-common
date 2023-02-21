# Workflow - Semantic pull request

Reusable workflow to ensure "Squash and merge" Pull Request strategy provides a valid commit message.
Checlk that the title follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

## Usage

### As reusable workflow

```yaml
on:
  push:
    branches:
      - main
jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/generate-dependabot-config.yml@main
```

### As required workflow

Configure workflow to be required in your organization settings.

`https://github.com/organizations/[your-organization]/settings/actions/required_workflows/new`
