<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Action: Repository owner is organization

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Action to check if the repository owner is an organization.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/repository-owner-is-organization@v0.7.5
  with:
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                     | **Description**                      | **Default**                      | **Required** |
| ----------------------------- | ------------------------------------ | -------------------------------- | ------------ |
| **<code>github-token</code>** | GitHub token for fetching users API. | <code>${{ github.token }}</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                   | **Description**                                                          | **Default** | **Required** |
| ---------------------------- | ------------------------------------------------------------------------ | ----------- | ------------ |
| <code>is-organization</code> | The boolean value indicating if the repository owner is an organization. | undefined   | undefined    |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
