import classNames from "classnames";
import {
  DeepActionType,
  useRecipeSessionStore,
} from "../../state/recipeSession";

enum RecipeMarketPlaceStatus {
  Active = "Use",
  ToInstall = "Install",
  Waitlist = "Waitlist",
  Soon = "Soon",
}

const RECIPE_INITIAL_MARKETPLACE = [
  {
    title: "OpenAI",
    project: "OpenAI",
    subheader: "Advanced AI Models On-Demand",
    description:
      "Harness the power of cutting-edge AI models. Integrate world-class natural language processing into your applications and transform the way you interact with data.",
    status: RecipeMarketPlaceStatus.Active,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/openai.png",
  },
  {
    title: "GIPHY",
    project: "GIPHY",
    subheader: "Dynamic GIFs at Your Fingertips",
    description:
      "Bring your platform to life! Embed Giphy's vast library of animated GIFs to add fun, expression, and creativity to any digital experience.",
    status: RecipeMarketPlaceStatus.Active,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/giphy.png",
  },
  {
    title: "Reddit",
    project: "Reddit",
    subheader: "Social Content Feeds and Comments",
    description:
      "Dive into a sea of content. Integrate Reddit's vast community discussions and user-generated content to enrich your platforms with dynamic social insights.",
    status: RecipeMarketPlaceStatus.Active,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/reddit.png",
  },
  {
    title: "Alpaca (YC W19)",
    project: "Alpaca",
    subheader: "Commission-Free Stock Trading API",
    description:
      "Democratize finance with Alpaca's trading API. Seamlessly execute trades, access real-time market data, and manage portfolios, all without commission fees.",
    status: RecipeMarketPlaceStatus.Soon,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/alpaca.png",
  },
  {
    title: "Google Maps",
    project: "Google Maps",
    subheader: "Map, Navigate, and Localize",
    description:
      "Connect users to the world. Integrate real-time mapping, navigation, and location-based services to provide tailored experiences and seamless journeys.",
    status: RecipeMarketPlaceStatus.Active,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/google%20maps.png",
  },
  {
    title: "Supabase (YC S20)",
    project: "Supabase",
    subheader: "Open-sourced Firebase Alternative",
    description:
      "Supabase is a feature-rich, open-source alternative to Firebase, offering a full suite of tools for rapidly building web applications, including real-time databases, instant APIs, and authentication. With Supabase, you have full control over your data and infrastructure, making it a favorite among developers prioritizing privacy and data sovereignty.",
    status: RecipeMarketPlaceStatus.Soon,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/supabase.png",
  },
  {
    title: "Pokéapi",
    project: "Pokéapi",
    subheader: "Pokédex, Pokémon, and Pokémon Moves",
    description:
      "Unleash the Pokémon universe! Access comprehensive Pokémon data, including abilities, moves, and stats, to create engaging applications, games, and experiences.",
    status: RecipeMarketPlaceStatus.Active,
    image:
      "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/pokemon.png",
  },
  {
    title: "Deepgram (YC W16)",
    project: "Deepgram",
    subheader: "AI-powered speech recognition",
    description:
      "Deepgram utilizes state-of-the-art AI technology for high accuracy speech recognition. Offering a suite of services, such as transcription, voice commands, and call analytics, Deepgram is a powerful tool for businesses seeking to harness the power of voice data. Its cutting-edge deep learning models deliver unparalleled performance, even in noisy environments or with complex multi-speaker conversations.",
    status: RecipeMarketPlaceStatus.Soon,
  },
];
export function RecipeHome() {
  return (
    <div className="flex-1 flex flex-col p-4">
      <h1 className="text-2xl font-bold">Recipe Marketplace</h1>
      <p>
        Discover recipes built from the community. More recipes will come soon.
      </p>
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 gap-4">
        {RECIPE_INITIAL_MARKETPLACE.map((recipe) => {
          return (
            <RecipeHomeBox
              key={recipe.title}
              project={recipe.project}
              title={recipe.title}
              subheader={recipe.subheader}
              description={recipe.description}
              status={recipe.status}
              image={recipe.image}
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
  project,
  description,
  status,
  image,
}: {
  title: string;
  project: string;
  subheader?: string;
  description: string;
  status: RecipeMarketPlaceStatus;
  image?: string;
}) {
  const addDeepAction = useRecipeSessionStore((state) => state.addDeepAction);
  return (
    <div className="border rounded-md shadow-sm p-4 space-y-1">
      <div className="flex justify-between ">
        <div className="flex items-center">
          {image && <img className="w-6 h-6 mr-2 object-cover" src={image} />}
          <h2 className="font-bold text-xl">{title}</h2>
        </div>
        <div
          className="tooltip"
          data-tip={
            status === RecipeMarketPlaceStatus.Soon
              ? "Join the waitlist!"
              : undefined
          }
        >
          <button
            className={classNames(
              "btn btn-neutral btn-sm",
              status === RecipeMarketPlaceStatus.Soon && "!btn-accent"
            )}
            onClick={() => {
              addDeepAction({
                type: DeepActionType.UpdateRecipeInput,
                payload: project,
              });
            }}
          >
            {status}
          </button>
        </div>
      </div>
      <h3 className="font-bold text-sm">{subheader ?? "Testing"}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
    </div>
  );
}
