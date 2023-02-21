# Workflow - Generate Dependabot Config

Reusable workflow to generate a dependabot config from predefined templates.

Mainly using [Generate Dependabot Glob Action](https://github.com/marketplace/actions/generate-dependabot-glob), to generate a dependabot config from a glob pattern.

Workaround for missing official support of glob directories [https://github.com/dependabot/dependabot-core/issues/2178](https://github.com/dependabot/dependabot-core/issues/2178)

## Usage

```yaml
on:
  push:
    branches:
      - main
jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/generate-dependabot-config.yml@main
```
