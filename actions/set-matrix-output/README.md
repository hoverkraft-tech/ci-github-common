<!-- start branding -->
<!-- end branding -->
<!-- start title -->

# GitHub Action: Set Matrix Output

<!-- end title -->
<!-- start badges -->
<!-- end badges -->
<!-- start description -->

Set matrix ouput in file to be uploaded as artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->

The GitHub Actions workflow ensures artifact uniqueness by concatenating the workflow's `run_id`, `run_number`, and a user-provided `artifact-name`.
Users can enhance this uniqueness by supplying a distinct `artifact-name` for each run, further ensuring that each artifact is uniquely identified across all runs and workflows.
This strategy effectively prevents any clashes or overwrites, maintaining the integrity and traceability of artifacts, especially when multiple workflows are executed concurrently or under similar configurations.

<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/set-matrix-output@v0.7.5
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

| **Output**                 | **Description**                                | **Default** | **Required** |
| -------------------------- | ---------------------------------------------- | ----------- | ------------ |
| <code>artifact-name</code> | The real unique name of the uploaded artifact. | undefined   | undefined    |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
