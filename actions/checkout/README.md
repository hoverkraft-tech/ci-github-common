<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:git-branch color:gray-dark>" /> GitHub Action: Checkout

<!-- end title -->
<!--
// jscpd:ignore-start
-->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a><img src="https://img.shields.io/github/last-commit/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Fissues"><img src="https://img.shields.io/github/issues/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads/hoverkraft-tech/ci-github-common/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!--
// jscpd:ignore-end
-->
<!-- start description -->

Action to checkout the repository compatible for PRs, issues and push events. Workaround for [https://github.com/actions/checkout/issues/331](https://github.com/actions/checkout/issues/331)

<!-- end description -->
<!-- start contents -->
<!-- end contents -->

Set permissions to read contents and pull-requests. This is required to get the PR branch.

```yaml
on: issue_comment
permissions:
  contents: read
  pull-requests: read
```

<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.16.0
  with:
    # Description: Number of commits to fetch. 0 indicates all history for all
    # branches and tags. See
    # [https://github.com/actions/checkout#usage](https://github.com/actions/checkout#usage)
    #
    # Default: 1
    fetch-depth: ""

    # Description: Whether to download Git-LFS files. See
    # [https://github.com/actions/checkout#usage](https://github.com/actions/checkout#usage)
    #
    # Default: false
    lfs: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                | **Description**                                                                                                                                                           | **Default**    | **Required** |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ |
| <code>fetch-depth</code> | Number of commits to fetch. 0 indicates all history for all branches and tags. See [https://github.com/actions/checkout#usage](https://github.com/actions/checkout#usage) | <code>1</code> | **false**    |
| <code>lfs</code>         | Whether to download Git-LFS files. See [https://github.com/actions/checkout#usage](https://github.com/actions/checkout#usage)                                             |                | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
