<!-- start branding -->

<img src=".github/ghadocs/branding.svg" width="15%" align="center" alt="branding<icon:download-cloud color:gray-dark>" />

<!-- end branding -->
<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:download-cloud color:gray-dark>" /> GitHub Action: Get matrix ouput

<!-- end title -->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fget-matrix-outputs%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release//ci-github-common/actions/get-matrix-outputs?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a><a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fget-matrix-outputs%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date//ci-github-common/actions/get-matrix-outputs?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a><img src="https://img.shields.io/github/last-commit//ci-github-common/actions/get-matrix-outputs?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2F%2Fci-github-common%2Factions%2Fget-matrix-outputs%2Fissues"><img src="https://img.shields.io/github/issues//ci-github-common/actions/get-matrix-outputs?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads//ci-github-common/actions/get-matrix-outputs/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!-- start description -->

Download matrix ouputs from artifacts, because GitHub action does not handle job outputs for matrix

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: /ci-github-common/actions/get-matrix-outputs@0.12.1
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
