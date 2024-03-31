<!-- start branding -->

<img src=".github/ghadocs/branding.svg" width="15%" align="center" alt="branding<icon:message-square color:gray-dark>" />

<!-- end branding -->
<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:message-square color:gray-dark>" /> GitHub Action: Create or update comment

<!-- end title -->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fcreate-or-update-comment%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release//ci-github-common/actions/create-or-update-comment?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a><a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fcreate-or-update-comment%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date//ci-github-common/actions/create-or-update-comment?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a><img src="https://img.shields.io/github/last-commit//ci-github-common/actions/create-or-update-comment?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fcreate-or-update-comment%2Fissues"><img src="https://img.shields.io/github/issues//ci-github-common/actions/create-or-update-comment?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads//ci-github-common/actions/create-or-update-comment/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!-- start description -->

Action to create or update comment in pull request or issue

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

Set permissions to wrtie issues and pull-requests. This is required to write the comment on the PR.

```yaml
permissions:
  issues: write
  pull-requests: write
```

<!-- start usage -->

```yaml
- uses: /ci-github-common/actions/create-or-update-comment@0.12.1
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
```

<!-- end usage -->
<!-- start inputs -->

| **Input**              | **Description**                                                                                                                                                                   | **Default** | **Required** |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
| <code>title</code>     | The comment title. Must be static and unique, will be used to retrieve the comment if exists already.                                                                             |             | **true**     |
| <code>body</code>      | The comment body. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment)                                          |             | **false**    |
| <code>reactions</code> | A comma separated list of reactions to add to the comment. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment) |             | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
