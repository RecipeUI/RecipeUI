---
sidebar_label: Improving cURL Parser
sidebar_position: 4

---

# Upgrade our cURL Parser

Our cURL Parser is relatively weak compared to other API tools. This is mainly just a consequence of being relatively new and needing to find all the edge cases. The ideal scenario is to find a library that is really good at interpreting cURL and just use that, but I wasn't able to find any.

If you find a good library or want to add test cases to make our cURL parser work better, then follow the steps below to see what files to change.

### Updating the test file

Find our test file over here https://github.com/RecipeUI/RecipeUI/blob/main/packages/utils/curlParser/index.test.ts

To run the test script, make sure you've installed our [repo](setup). You will want to fully install it to run the actual code locally later.

Then run,
```
pnpm utils:test -- --watch
```

### TBC