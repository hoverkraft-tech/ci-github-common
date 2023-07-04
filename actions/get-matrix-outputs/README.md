<!-- start title -->

# GitHub Action: Get matrix ouput

<!-- end title -->
<!-- start description -->

Download matrix ouputs from artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/get-matrix-outputs@v0.7.1
  with:
    # The name of the artifact to download.
    artifact-name: ""

    # Define weather to remove the downloaded artifact after reading.
    # Default: true
    remove-artifact: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                        | **Description**                                                 | **Default**       | **Required** |
| -------------------------------- | --------------------------------------------------------------- | ----------------- | ------------ |
| **<code>artifact-name</code>**   | The name of the artifact to download.                           |                   | **true**     |
| **<code>remove-artifact</code>** | Define weather to remove the downloaded artifact after reading. | <code>true</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| \***\*Output\*\***  | \***\*Description\*\***           | \***\*Default\*\*** | \***\*Required\*\*** |
| ------------------- | --------------------------------- | ------------------- | -------------------- |
| <code>result</code> | The matrix combined JSON outputs. | undefined           | undefined            |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
