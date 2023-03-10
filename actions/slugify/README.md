<!-- start title -->

# GitHub Action: Slugify

<!-- end title -->
<!-- start description -->

Action to slugify a given string value

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/slugify@v0.3.1
  with:
    # The value to slugify
    value: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**              | **Description**      | **Default** | **Required** |
| ---------------------- | -------------------- | ----------- | ------------ |
| **<code>value</code>** | The value to slugify |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| \***\*Output\*\***  | \***\*Description\*\*** | \***\*Default\*\*** | \***\*Required\*\*** |
| ------------------- | ----------------------- | ------------------- | -------------------- |
| <code>result</code> | The slugified value     | undefined           | undefined            |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
