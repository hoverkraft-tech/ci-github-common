<!-- start title -->

# GitHub Reusable Workflow: Generate Dependabot Config

<!-- end title -->
<!-- start description -->

Reusable workflow to generate a dependabot config from predefined templates.
Mainly using [Generate Dependabot Glob Action](https://github.com/marketplace/actions/generate-dependabot-glob), to generate a dependabot config from a glob pattern.
Workaround for missing official support of glob directories [https://github.com/dependabot/dependabot-core/issues/2178](https://github.com/dependabot/dependabot-core/issues/2178)

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: Generate dependabot.yml config
on:
  push:
    branches:
      - main
jobs:
  main:
    uses: hoverkraft-tech/ci-github-common/.github/workflows/generate-dependabot-config.yml@0.3.4
```

<!-- end usage -->
<!-- start secrets -->
<!-- end secrets -->
<!-- start inputs -->

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
