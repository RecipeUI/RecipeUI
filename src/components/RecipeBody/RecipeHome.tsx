const RECIPE_INITIAL_MARKETPLACE = [
  {
    title: "OpenAI",
    subheader: "Advanced AI Models On-Demand",
    description:
      "Harness the power of cutting-edge AI models. Integrate world-class natural language processing into your applications and transform the way you interact with data.",
  },
  {
    title: "Reddit",
    subheader: "Social Content Feeds and Comments",
    description:
      "Dive into a sea of content. Integrate Reddit's vast community discussions and user-generated content to enrich your platforms with dynamic social insights.",
  },
  {
    title: "Alpaca (YC W19)",
    subheader: "Commission-Free Stock Trading API",
    description:
      "Democratize finance with Alpaca's trading API. Seamlessly execute trades, access real-time market data, and manage portfolios, all without commission fees.",
  },
  {
    title: "Google Maps",
    subheader: "Map, Navigate, and Localize",
    description:
      "Connect users to the world. Integrate real-time mapping, navigation, and location-based services to provide tailored experiences and seamless journeys.",
  },
  {
    title: "GIPHY",
    subheader: "Dynamic GIFs at Your Fingertips",
    description:
      "Bring your platform to life! Embed Giphy's vast library of animated GIFs to add fun, expression, and creativity to any digital experience.",
  },
  {
    title: "Pokémon",
    subheader: "Pokédex, Pokémon, and Pokémon Moves",
    description:
      "Unleash the Pokémon universe! Access comprehensive Pokémon data, including abilities, moves, and stats, to create engaging applications, games, and experiences.",
  },
];
export function RecipeHome() {
  return (
    <div className="flex-1 flex flex-col p-4">
      <h1 className="text-2xl font-bold">Recipe Marketplace</h1>
      <p>
        Discover recipes built from the community. More recipes will come soon.
      </p>
      <div className="flex sm:grid sm:grid-cols-3 mt-4 gap-4">
        {RECIPE_INITIAL_MARKETPLACE.map((recipe) => {
          return (
            <RecipeHomeBox
              key={recipe.title}
              title={recipe.title}
              subheader={recipe.subheader}
              description={recipe.description}
            />
          );
        })}
      </div>
    </div>
  );
}

function RecipeHomeBox({
  title,
  subheader,
  description,
}: {
  title: string;
  subheader?: string;
  description: string;
}) {
  return (
    <div className="border rounded-md shadow-sm p-4 space-y-1">
      <div className="flex justify-between">
        <h2 className="font-bold text-xl">{title}</h2>
        <button className="btn btn-neutral btn-sm">Use</button>
      </div>
      <h3 className="font-bold text-sm">{subheader ?? "Testing"}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
    </div>
  );
}
