import Downshift from "downshift";
import classNames from "classnames";
import { create } from "zustand";

type RecipeMeta = {
  project: string;
  name: string;
  description: string;
  route: string;
  route_type: string;
};

interface RecipeBodyState {
  selectedRecipe: RecipeMeta | null;
  setSelectedRecipe: (recipe: RecipeMeta) => void;
}

const useRecipeBodyStore = create<RecipeBodyState>((set) => ({
  selectedRecipe: null as RecipeMeta | null,
  setSelectedRecipe: (recipe) => set(() => ({ selectedRecipe: recipe })),
}));

export function RecipeBodyContainer() {
  const selectedRecipe = useRecipeBodyStore((state) => state.selectedRecipe);
  return (
    <div className="flex-1 p-4">
      <RecipeBodySearch />
      {selectedRecipe && <RecipeBody selectedRecipe={selectedRecipe} />}
    </div>
  );
}

export function RecipeBody({ selectedRecipe }: { selectedRecipe: RecipeMeta }) {
  return <div>{selectedRecipe.name}</div>;
}

function RecipeBodySearch() {
  const recipeItems = [
    {
      project: "OpenAI",
      name: "Chat Completion",
      description: "Creates a model response for the given chat conversation.",
      route: "https://api.openai.com/v1/chat/completions",
      route_type: "POST",
    },
    {
      project: "OpenAI",
      name: "Create image",
      description: "Creates an image given a prompt.",
      route: "https://api.openai.com/v1/images/generations",
      route_type: "POST",
    },
    {
      project: "OpenAI",
      name: "List models",
      description:
        "Lists the currently available models, and provides basic information about each one such as the owner and availability. Lists the currently available models, and provides basic information about each one such as the owner and availability.",
      route: "https://api.openai.com/v1/models",
      route_type: "GET",
    },
  ];

  const setSelectedRecipe = useRecipeBodyStore(
    (state) => state.setSelectedRecipe
  );

  return (
    <Downshift<(typeof recipeItems)[number]>
      onChange={(selection) => {
        if (selection) {
          setSelectedRecipe(selection);
        }
      }}
      itemToString={(item) => (item ? item.route : "")}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        getToggleButtonProps,
        isOpen,
        inputValue,
        highlightedIndex,
        selectedItem,
        getRootProps,
      }) => (
        <div className="">
          <div className="flex flex-col">
            <div
              className="flex space-x-2"
              {...getRootProps({}, { suppressRefError: true })}
            >
              <div className="input input-bordered flex-1 flex items-center space-x-2">
                {selectedItem?.route_type && (
                  <RouteTypeLabel route_type={selectedItem.route_type} />
                )}
                <input
                  placeholder="Best book ever"
                  className="outline-none w-full"
                  {...getInputProps()}
                />
              </div>
              <button
                aria-label={"toggle menu"}
                className="btn w-24"
                type="button"
                {...getToggleButtonProps()}
              >
                Send
              </button>
            </div>
          </div>
          <ul
            className={`w-[calc(100%-6.5rem)] mt-2 border shadow-md max-h-80 overflow-scroll rounded-md z-10 ${
              !(isOpen && recipeItems.length) && "hidden"
            }`}
            {...getMenuProps()}
          >
            {isOpen
              ? recipeItems
                  // .filter(
                  //   (item) =>
                  //     !inputValue ||
                  //     item.title
                  //       .toLowerCase()
                  //       .includes(inputValue.toLowerCase()) ||
                  //     item.author
                  //       .toLowerCase()
                  //       .includes(inputValue.toLowerCase())
                  // )
                  .map((item, index) => {
                    const optionLabel = `${item.project} / ${item.name}`;

                    return (
                      <li
                        className={classNames(
                          selectedItem === item &&
                            highlightedIndex !== index &&
                            "bg-gray-300",
                          highlightedIndex === index && "bg-blue-300",
                          "py-2 px-4 shadow-sm flex space-x-2"
                        )}
                        {...getItemProps({
                          key: `${item.project}-${item.name}`,
                          index,
                          item,
                        })}
                      >
                        <RouteTypeLabel route_type={item.route_type} />
                        <div className="flex-1">
                          <div className="text-base">
                            <span className="">{optionLabel} - </span>
                            <span>{item.route}</span>
                          </div>
                          <div className="line-clamp-2 text-gray-600 text-sm">
                            {item.description}
                          </div>
                        </div>
                      </li>
                    );
                  })
              : null}
          </ul>
        </div>
      )}
    </Downshift>
  );
}

function RouteTypeLabel({ route_type }: { route_type: string }) {
  return (
    <span
      className={classNames(
        "w-14",
        route_type === "GET" && "text-green-600",
        route_type === "POST" && "text-orange-600",
        route_type === "PUT" && "text-orange-600"
      )}
    >
      {route_type}
    </span>
  );
}
