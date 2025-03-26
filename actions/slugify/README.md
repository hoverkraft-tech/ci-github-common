<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:link-2 color:gray-dark>" /> GitHub Action: Slugify

<!-- end title -->
<!--
// jscpd:ignore-start
-->
<!-- markdownlint-disable MD013 -->
<!-- start badges -->

<a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20tag" /></a><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Freleases%2Flatest"><img src="https://img.shields.io/github/release-date/hoverkraft-tech/ci-github-common?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release%20by%20date" /></a><img src="https://img.shields.io/github/last-commit/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Commit" /><a href="https%3A%2F%2Fgithub.com%2Fhoverkraft-tech%2Fci-github-common%2Fissues"><img src="https://img.shields.io/github/issues/hoverkraft-tech/ci-github-common?logo=github&style=flat-square" alt="Open%20Issues" /></a><img src="https://img.shields.io/github/downloads/hoverkraft-tech/ci-github-common/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!-- markdownlint-enable MD013 -->
<!--
// jscpd:ignore-end
-->
<!-- start description -->

Action to slugify a given string value

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common@0.20.0
  with:
    # Description: The value to slugify
    #
    value: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**          | **Description**      | **Default** | **Required** |
| ------------------ | -------------------- | ----------- | ------------ |
| <code>value</code> | The value to slugify |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| **Output**          | **Description**     |
| ------------------- | ------------------- |
| <code>result</code> | The slugified value |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
