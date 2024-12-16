<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:upload-cloud color:gray-dark>" /> GitHub Action: Set matrix ouput

<!-- end title -->
<!--
// jscpd:ignore-start
-->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a>
<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a>
<img src="https://img.shields.io/github/last-commit/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Commit" />
<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Fissues"><img src="https://img.shields.io/github/issues/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Open%20Issues" /></a>
<img src="https://img.shields.io/github/downloads/hoverkraft-tech/ci-github-common/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!--
// jscpd:ignore-end
-->
<!-- start description -->

Set matrix ouput in file to be uploaded as artifacts, because GitHub Action does not handle job outputs for matrix

<!-- end description -->

The GitHub Actions workflow ensures artifact uniqueness by concatenating the workflow's `run_id`, `run_number`, and a user-provided `artifact-name`.
Users can enhance this uniqueness by supplying a distinct `artifact-name` for each run, further ensuring that each artifact is uniquely identified across all runs and workflows.
This strategy effectively prevents any clashes or overwrites, maintaining the integrity and traceability of artifacts, especially when multiple workflows are executed concurrently or under similar configurations.

<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.15.0
  with:
    # Description: The matrix output to set.
    #
    value: ""

    # Description: The name of the artifact to upload.
    #
    artifact-name: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                  | **Description**                     | **Default** | **Required** |
| -------------------------- | ----------------------------------- | ----------- | ------------ |
| <code>value</code>         | The matrix output to set.           |             | **true**     |
| <code>artifact-name</code> | The name of the artifact to upload. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                 | **Description**                                |
| -------------------------- | ---------------------------------------------- |
| <code>artifact-name</code> | The real unique name of the uploaded artifact. |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
