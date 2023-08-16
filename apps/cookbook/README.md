# Cookbook

We need your help in making recipes discoverable and easy to use. This doesn't require writing code, it just requires you telling us what the API of an endpoint looks. If we take your submission we'd love to add you as a contributor for anyone using that recipe to see!

## API Cookbooks
These are sorted from ones that are incomplete and need help!
[] Starwars
[] Pokemon
[] Reddit
[-] OpenAI
[] GIPHY


## (WIP) Recipe Philosophy  


### Why are recipes verbose?
Our friends at OpenAPI and GraphQL have learned how to make very neat and concise API specs. Unlike them, some of our recipes reuse the same parameters, output, or authentication pieces.

Fundamentally, we want you to be able to look at any recipe and figure out how it works inside out. It's inefficient for storage and maybe for maintenance but it has a few the ux benefits
- Easy for anyone to contribute
- Easy to understand
- Easy for programs to understand

Maybe, we'll have a fancy transpiler for schemas in the future to be efficient, but for now we just want our APIs and our schemas stupidly easy to use.
