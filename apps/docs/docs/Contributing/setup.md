---
sidebar_position: 1
sidebar_label: Setup RecipeUI locally
---

# Getting Started

You'll need the following things installed before doing anything
- [pnpm](https://pnpm.io/installation) 
- [rust](https://www.rust-lang.org/tools/install)
- [node](https://nodejs.org/en/download)

## Setup Repo

Clone with

```
git clone https://github.com/RecipeUI/RecipeUI.git
``` 

At the root folder, make sure to run pnpm install. We need pnpm (not npm or yarn) for our monorepo structure.
```
pnpm i
```

## Spinning up web

Inside the root folder, run the snippet below.

```
pnpm run web:dev
```

The desktop app is the preferred environment to test in, but might not be accessible locally to some folks due to lack of native OS support from Tauri (e.g Ubuntu).

## Spinning up desktop
Make sure you are inside of `/apps/desktop` now (NOT the root folder).


Run the command below to spin up the desktop app. The first time takes the longest, but then it's lightning quick after.
```
pnpm tauri dev
```

Note: This will expose localhost:5173. Although you can access this on the web, you should just use the desktop app. If the desktop app does not open up for you, then this might be a limitation of Tauri that we need to support. Please reach out in our discord for any questions https://discord.gg/rXmpYmCNNA

## Supabase/cloud support
Currently, RecipeUI is 95% local index-db. Our only use case for a database is sharing collections online, so we do not have support for self-hosting yet. You should have core functionality of the API tool without supabase integration as we currently don't require login for anything.

If you would like support for this, give us a ring on discord. Most likely, you will need to create a free supabase instance and just edit the .env