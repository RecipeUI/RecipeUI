# RecipeUI
Will make this better soon


## Open Source Philisophy
We are open sourced and anyone can build on top of us. We also desperately want your help in building new recipes so everyone can build more tools! These don't actually require much coding experience, you just have to be able to write JSON and we'll happily give you a shout out.

To be upfront, we want our product to be free for most use cases, but we do have a plan to charge for enterprise teams. Our history of building recipes started internally because we wanted to make the lives of our teammates at Meta and Robinhood easier. Nothing made my teammates happier when they stopped sending me scripts on slack and started using this ugly internal UI tool I built for them. Eventually, we want to help teams build private recipes that they can easily share in seconds internally.

How about our plans for everyone else? Well I think that's up to the community to decide! I think it would be pretty cool if people didn't just test APIs on our platform, but built their own. Even cooler is if we helped people build full-fledged apps one day!

## Telemetry
You can find all areas we track anonymously on Posthog by looking at the file 
`ui/src/utils/posthogConstants.ts`.

The main things we track are project visits and recipe URL submissions (no params or responses are logged). We track this info because it'll help us provide a better user experience and also give us signal on projects or recipes to focus on. 

Our repo is easy to run and deploy locally, so if you want to opt out of this experience you can!
