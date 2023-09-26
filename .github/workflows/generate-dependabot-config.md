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
    uses: hoverkraft-tech/ci-github-common/.github/workflows/generate-dependabot-config.yml@0.7.4
    with:
      # GitHub App ID to generate GitHub token in place of github-token.
      # See https://github.com/tibdex/github-app-token
      github-app-id: ""

    secrets:
      # GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write).
      # See [actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request)
      github-token: ""

      # GitHub App private key to generate GitHub token in place of github-token.
      # See https://github.com/tibdex/github-app-token
      github-app-key: ""
```

<!-- end usage -->
<!-- start secrets -->

| **Secret**                      | **Description**                                                                                                                                                                                     | **Default**               | **Required** |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| **<code>github-token</code>**   | GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write). See [actions/create-and-merge-pull-request](../../actions/create-and-merge-pull-request) | <code>GITHUB_TOKEN</code> | **false**    |
| **<code>github-app-key</code>** | GitHub App private key to generate GitHub token in place of <code>github-token</code>. See [https://github.com/tibdex/github-app-token](https://github.com/tibdex/github-app-token)                 | <code></code>             | **false**    |

<!-- end secrets -->
<!-- start inputs -->

| **Inputs**                     | **Description**                                                                                                                                                            | **Default**   | **Required** |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ |
| **<code>github-app-id</code>** | GitHub App ID to generate GitHub token in place of <code>github-token</code>. See [https://github.com/tibdex/github-app-token](https://github.com/tibdex/github-app-token) | <code></code> | **false**    |

<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
