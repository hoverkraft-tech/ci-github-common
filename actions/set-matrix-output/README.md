<!-- start title -->

# GitHub Action: Set matrix ouput

<!-- end title -->
<!-- start description -->

Set matrix ouput in file to be uploaded as artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@v0.3.0
  with:
    # The matrix output to set.
    value: ""

    # The name of the artifact to upload.
    artifact-name: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                      | **Description**                     | **Default** | **Required** |
| ------------------------------ | ----------------------------------- | ----------- | ------------ |
| **<code>value</code>**         | The matrix output to set.           |             | **true**     |
| **<code>artifact-name</code>** | The name of the artifact to upload. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| \***\*Output\*\***  | \***\*Description\*\***           | \***\*Default\*\*** | \***\*Required\*\*** |
| ------------------- | --------------------------------- | ------------------- | -------------------- |
| <code>result</code> | The matrix combined JSON outputs. | undefined           | undefined            |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
