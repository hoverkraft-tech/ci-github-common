<!-- start title -->

# GitHub Action: Create or update comment

<!-- end title -->
<!-- start description -->

Action to create or update comment in pull request or issue

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/create-or-update-comment@v0.3.4
  with:
    # The comment title. Must be static and unique, will be used to retrieve the
    # comment if exists already.
    title: ""

    # The comment body. See https://github.com/peter-evans/create-or-update-comment
    body: ""

    # A comma separated list of reactions to add to the comment. See
    # https://github.com/peter-evans/create-or-update-comment
    reactions: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                  | **Description**                                                                                                                                                                   | **Default** | **Required** |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
| **<code>title</code>**     | The comment title. Must be static and unique, will be used to retrieve the comment if exists already.                                                                             |             | **true**     |
| **<code>body</code>**      | The comment body. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment)                                          |             | **false**    |
| **<code>reactions</code>** | A comma separated list of reactions to add to the comment. See [https://github.com/peter-evans/create-or-update-comment](https://github.com/peter-evans/create-or-update-comment) |             | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
