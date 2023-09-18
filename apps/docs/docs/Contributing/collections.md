---
sidebar_position: 2
sidebar_label: Building collections
---

# Building collections

Contributing code to our repo is as simple as creating a public collection with a [GitHub PR](https://github.com/RecipeUI/RecipeUI/pull/30). Once you create a collection, you can use our CLI to contribute it to our repo for everyone to use.

This will require you to fork/clone our [GitHub repo](https://github.com/RecipeUI/RecipeUI) to commit code.

### Step 1 - Build a collection of APIs

Create a folder and start building a collection of APIs!

![Build Collection](@site/static/img/contributing/1collection.jpg)

### Step 2 - Publish your collection

Publish your folder. This will require login (cloud features are the only thing we login block). 

![Publish Collection](@site/static/img/contributing/2collection.jpg)



### Step 3 - Get your UUID

Once you publish a collection, you should reach be re-directed to your collection page. This will appear at the top of the [collections page](https://recipeui.com/collections) in the navbar.

Before moving on, you should edit the title, description, and possibly add an image to your collection. Once you're ready, hit the share button on the top right to save your collection URL for the next step.

![Share Collection](@site/static/img/contributing/3collection.jpg)


### Step 4 - Use our CLI

:::info

You will need to have cloned our repo to do this step. Please follow the [instructions](setup) to clone and run our repo locally.

If you are unable to clone a repo, you can message our discord group so we can pair program or we can create the pull request for you (we will attribute you).

:::

Inside of the root folder of the monorepo (**NOT  /apps/desktop**), run 

```
pnpm collections contribute
```

![Use CLI](@site/static/img/contributing/4collection.jpg)

### Step 5 - Create a PR

After step 4, you should have some code changes that you can commit. Create a PR for us to review similar to [GitHub PR](https://github.com/RecipeUI/RecipeUI/pull/30). Ping us on [discord](https://discord.gg/rXmpYmCNNA) so we can showcase and approve it faster!




