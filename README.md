# RecipeUI
RecipeUI is an open source Postman alternative for teams. Designed for the whole team (devs, PMs, QA, Ops), anyone can test APIs in seconds with just a click of a button.

Try us out [www.recipeui.com](https://recipeui.com/)

![RecipeUI API Client](https://raw.githubusercontent.com/RecipeUI/RecipeUI/main/docs/github_view.png)

## Built with
Couldn't have built this app without some really amazing packages
- 🐻 Zustand + immer for global state management
- 💨 Tailwind + 🌼 DaisyUI for making me build pretty and native html components
- 🔺 NextJS + Vercel for a seamless frontend framework and deployment package
- ⚡ Supabase for a seamless backend service that has many cool features. 
- 🪞 Codemirror for the easy code editor plugin
- 🦖 Docusaurus for docs!
- Other fun stuff: pnpm, downshift, fuse, react18-json-view

Contributors
- @[dvtng] for the continuous feedback on system design and ux of the overall project


## Contributing
We need help in three ways and they don't require coding!
1. Play around with our platform! We're less than 1 month old, but we want to redefine the API testing experience.
2. We need recipes! Start making some and sharing them with people.
3. We need API suggestions for our platform. Bonus if you can help write the schemas (we'll have more docs on this soon).



## Open Source Philosophy
API requests can contain sensitive data, especially internals APIs, so we want to be transparent about how RecipeUI is built and how we handle data. We invite people to contribute to our repo in many ways that don't require coding experience! Simplest thing we can ask for is suggesting API's to add on to our platform or writing the API spec itself as JSON inside of our cookbook and we'll happily give you a shout out.

To be upfront, we want our product to be free for personal use cases, but we do have a plan to charge for enterprise teams. Our history of building recipes started internally because we wanted to make the lives of our teammates at Meta and Robinhood easier. Nothing made our teammates happier when they stopped sending me scripts on slack and started using this ugly internal UI tool we built for them. Eventually, we want to help teams build private recipes that they can quickly share with teammates to setup workflows in seconds.

How about our plans for everyone else? Well I think that's up to the community to decide! I think it would be pretty cool if people didn't just test APIs on our platform, but built their own apps or APIs.

## Getting this to run
I'll try to add support for this ASAP. Currently, the app is in an Alpha phase and focused on fixing bugs first. Will probably have a self-hot option end of Aug.

## Telemetry
You can find all areas we track anonymously on Posthog by looking at the file [posthog.ts](./ui/src/utils/constants/posthog.ts)

We track project visits, recipe sharing, and recipe usage. We don't store any authorization and tracking is anonymized (to the extent Posthog helps with). We track this info because it'll help us provide a better user experience and also give us signal on projects or recipes to focus on. 

Our repo will SOON be easy to run and deploy locally, so if you want to opt out of this experience you can!
