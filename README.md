## date-fns-codemod

### Usage

`npx @date-fns/upgrade-codemod <path> [...options]`
  * `path` files or directory to transform
  * `--dry` option for a dry-run
  * `--print` option to print the output for comparison

#### Example

```sh
npx @date-fns/upgrade-codemod src/
```

### Codemods applied

*N.B.* At the moment this codemod applies fixes ONLY for first 3 points of
2.0 date-fns [CHANGELOG](https://github.com/date-fns/date-fns/blob/master/CdHANGELOG.md#changed)\
You'll have to take care of all the other breaking changes.

Codemod imports required tools from `@date-fns/upgrade` and wraps
`date-fns` function call arguments accordingly.

```diff
+import { legacyParse, legacyParseMap, convertTokens } from '@date-fns/upgrade/v2'

 const dateIs = '2019-07-01'

 const someToken = 'MM-DD';
-const format = importedFormat('2019-07-01', someToken)
-const closestIndex = closestToIndex(new Date(2015, 8, 6), [
-  new Date(2015, 0, 1),
-  new Date(2016, 0, 1),
-  new Date(2017, 0, 1)
-])
-const addSecondsPlease = addSeconds(dateIs, 999)
-const isoDay = getThatDay(new Date())
+const format = importedFormat(
+  legacyParse('2019-07-01'),
+  convertTokens(someToken)
+)
+const closestIndex = closestToIndex(
+  legacyParse(new Date(2015, 8, 6)),
+  legacyParseMap([
+    new Date(2015, 0, 1),
+    new Date(2016, 0, 1),
+    new Date(2017, 0, 1)
+  ])
+)
+const addSecondsPlease = addSeconds(legacyParse(dateIs), 999)
+const isoDay = getThatDay(legacyParse(new Date()))
```

Codemod also changes import locations

```diff
 import * as importedFormat from 'date-fns/format'
-import closestToIndex from 'date-fns/closest_to_index'
-import addSeconds from 'date-fns/add_seconds'
-import getThatDay from 'date-fns/get_iso_day'
+import closestToIndex from 'date-fns/closestToIndex'
+import addSeconds from 'date-fns/addSeconds'
+import getThatDay from 'date-fns/getISODay'
```

### PRs welcome!
