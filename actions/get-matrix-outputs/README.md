<!-- start title -->

# GitHub Action: Get matrix ouput

<!-- end title -->
<!-- start description -->

Download matrix ouputs from artifacts, because github action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@main
  with:
    # The name of the artifact to download.
    artifact-name: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                      | **Description**                       | **Default** | **Required** |
| ------------------------------ | ------------------------------------- | ----------- | ------------ |
| **<code>artifact-name</code>** | The name of the artifact to download. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| \***\*Output\*\***  | \***\*Description\*\***           | \***\*Default\*\*** | \***\*Required\*\*** |
| ------------------- | --------------------------------- | ------------------- | -------------------- |
| <code>result</code> | The matrix combined JSON outputs. | undefined           | undefined            |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
