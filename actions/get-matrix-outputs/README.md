<!-- start title -->

# GitHub Action: Get matrix ouput

<!-- end title -->
<!--
// jscpd:ignore-start
-->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a>
<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a>
<img src="https://img.shields.io/github/last-commit/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Fissues">
<img src="https://img.shields.io/github/issues/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads/hoverkraft-tech/ci-github-common/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!--
// jscpd:ignore-end
-->
<!-- start description -->

Download matrix ouputs from artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.13.2
  with:
    # Description: The name of the artifact to download.
    #
    artifact-name: ""

    # Description: Define weather to remove the downloaded artifact after reading.
    #
    # Default: true
    remove-artifact: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                    | **Description**                                                 | **Default**       | **Required** |
| ---------------------------- | --------------------------------------------------------------- | ----------------- | ------------ |
| <code>artifact-name</code>   | The name of the artifact to download.                           |                   | **true**     |
| <code>remove-artifact</code> | Define weather to remove the downloaded artifact after reading. | <code>true</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**          | **Description**                   |
| ------------------- | --------------------------------- |
| <code>result</code> | The matrix combined JSON outputs. |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
