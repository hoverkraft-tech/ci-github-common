<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:message-square color:gray-dark>" /> GitHub Action: Create or update comment

<!-- end title -->
<!--
// jscpd:ignore-start
-->
<!-- markdownlint-disable MD013 -->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a><img src="https://img.shields.io/github/last-commit/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Fissues"><img src="https://img.shields.io/github/issues/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads/hoverkraft-tech/ci-github-common/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!-- markdownlint-enable MD013 -->
<!--
// jscpd:ignore-end
-->
<!-- start description -->

Action to create or update comment in pull request or issue

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

Set permissions to write issues and pull-requests. This is required to write the comment on the PR.

```yaml
permissions:
  issues: write
  pull-requests: write
```

<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.23.0
  with:
    # Description: The comment title. Must be static and unique, will be used to
    # retrieve the comment if exists already.
    #
    title: ""

    # Description: The comment body. See
    # [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment)
    #
    body: ""

    # Description: A comma separated list of reactions to add to the comment. See
    # [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment)
    #
    reactions: ""

    # Description: The comment author. Default is github-actions[bot].
    #
    # Default: github-actions[bot]
    comment-author: ""

    # Description: Optional token to interact with GitHub API. If not defined or
    # empty, the action will use the GITHUB_TOKEN provided by GitHub.
    #
    token: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                   | **Description**                                                                                                                                                                   | **Default**                      | **Required** |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------ |
| <code>title</code>          | The comment title. Must be static and unique, will be used to retrieve the comment if exists already.                                                                             |                                  | **true**     |
| <code>body</code>           | The comment body. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment)                                          |                                  | **false**    |
| <code>reactions</code>      | A comma separated list of reactions to add to the comment. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment) |                                  | **false**    |
| <code>comment-author</code> | The comment author. Default is github-actions[bot].                                                                                                                               | <code>github-actions[bot]</code> | **false**    |
| <code>token</code>          | Optional token to interact with GitHub API.<br />If not defined or empty, the action will use the GITHUB_TOKEN provided by GitHub.                                                |                                  | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
