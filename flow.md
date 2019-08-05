### Collect imports

- Default import specifiers (like `import dateFns from "date-fns"`) are `default`
- Named import specifiers (like `import { format } from "date-fns"`) are `named`
- Submodule default import specifiers (like `import format from "date-fns/format"`) are `module`

### Walk over collection

##### `default`

1. Find `CallExpression` with `MemberExpression` call
1. Replace call with same call with wrapped arguments
   1. Pick argument type based on `memberName`
      ```
        const memberName = ((node.callee as MemberExpression)
        .property as Identifier).name
      ```
   2. Iterate over arguments, replace them accordingly. Differentiate between `Literal` and `Identifier`
   3. Mark argument type as `true` in `usedArguments` object

### Add imports from `date-fns-upgrade`

- use `usedArguments` object
