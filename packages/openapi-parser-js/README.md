# OpenAPI Parser
This will take an OpenAPI 3.0 spec and convert it to a recipes.json. A good example to use would be [OpenAI](https://github.com/openai/openai-openapi/blob/master/openapi.yaml)

Install dependencies
```
// You can also use npm install or yarn
pnpm install
```

## Usage
To use this, create an `input.yaml` in the same folder as `openapi-parser/index.js`.

Then run the code snippets below. Make sure your terminal context is the same as `openapi-parser/index.js`.

```
node index.js parse-yaml -p PROJECT_NAME -v VERSION_NUMBER

// PROJECT_NAME should be the name of the software (Slack, OpenAI, Reddit)
// VERSION_NUMBER should be API version
```

This will create a folder in recipes called {PROJECT_NAME}_v{VERSION_NUMBER}. For example
```
node index.js parse-yaml -p OpenAI -v 1
```

This will output `recipes/OpenAI_v1/recipes.json`

## Debugging
Let's be real, just add a bunch of console.logs later and remove them when you're done. 

There's one extra command called debug-artifacts. This will output a few schemas inside `openapi-parser/output` that will be useful for understanding the shape of schemas.

```
node index.js parse-yaml -p PROJECT_NAME -v VERSION_NUMBER --debug-artifacts
```


## Extra Things
I'll document this better but for my future self
- We can add examples and tags to recipes.json and they won't be overridden when we re-run the script.
- If we want to ignore an example, we can add the deprecrated property in recipes.json