<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Action: Get Matrix Outputs

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Download matrix ouputs from artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/get-matrix-outputs@v0.7.5
  with:
    # The name of the artifact to download.
    artifact-name: ""

    # Define weather to remove the downloaded artifact after reading. Requires token input.
    # Default: true
    remove-artifact: ""

    # GitHub token with read and write access to actions for the repository.
    # Default: ${{ github.token }}
    token: ${{ secrets.GITHUB_TOKEN }}
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                        | **Description**                                                                       | **Default**                      | **Required** |
| -------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- | ------------ |
| **<code>artifact-name</code>**   | The name of the artifact to download.                                                 |                                  | **true**     |
| **<code>remove-artifact</code>** | Define weather to remove the downloaded artifact after reading. Requires token input. | <code>true</code>                | **false**    |
| **<code>token</code>**           | GitHub token with read and write access to actions for the repository.                | <code>${{ github.token }}</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**          | **Description**                   | **Default** | **Required** |
| ------------------- | --------------------------------- | ----------- | ------------ |
| <code>result</code> | The matrix combined JSON outputs. | undefined   | undefined    |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
