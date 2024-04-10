<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:git-pull-request color:gray-dark>" /> GitHub Action: Create and merge Pull Request

<!-- end title -->
<!-- start branding -->

<img src=".github/ghadocs/branding.svg" width="15%" align="center" alt="branding<icon:git-pull-request color:gray-dark>" />

<!-- end branding -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Action to create and merge Pull Request. Opinionated, set GitHub Actions bot as author, then rebase and merge.

<!-- end description -->

For this action to work you must explicitly allow GitHub Actions to create pull requests. See [
Allow GitHub Actions to create and approve pull requests](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)

<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.13.1
  with:
    # Description: GitHub token for creating and merging pull request (permissions
    # contents: write and pull-requests: write).
    # See https://github.com/peter-evans/create-pull-request#action-inputs.
    #
    # Default: ${{ github.token }}
    github-token: ""

    # Description: The pull request branch name
    #
    branch: ""

    # Description: The pull request title
    #
    title: ""

    # Description: The pull request body
    #
    body: ""

    # Description: The commit message for the pull request
    #
    commit-message: ""
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                   | **Description**                                                                                                                                                                    | **Default**                      | **Required** |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------ |
| <code>github-token</code>   | GitHub token for creating and merging pull request (permissions contents: write and pull-requests: write). See <https://github.com/peter-evans/create-pull-request#action-inputs>. | <code>${{ github.token }}</code> | **false**    |
| <code>branch</code>         | The pull request branch name                                                                                                                                                       |                                  | **true**     |
| <code>title</code>          | The pull request title                                                                                                                                                             |                                  | **true**     |
| <code>body</code>           | The pull request body                                                                                                                                                              |                                  | **true**     |
| <code>commit-message</code> | The commit message for the pull request                                                                                                                                            |                                  | **true**     |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
