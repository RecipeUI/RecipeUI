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

## Spinning up dev
Make sure you are inside of `/apps/desktop` now.


Run the command below to spin up the desktop app. The first time takes the longest, but then it's lightning quick after.
```
pnpm tauri dev
```

Note: This will expose localhost:5173. Although you can access this on the web, you should just use the desktop app. Enjoy and please reach out in our discord for any questions https://discord.gg/rXmpYmCNNA

## Supabase support
Supabase/self-hosting support is not setup for this repo yet. You should have core functionality of the API tool without supabase integration as we currently don't require login for anything.
