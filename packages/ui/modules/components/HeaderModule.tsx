import { ModuleSetting } from "..";
import { useIsTauri } from "../../hooks/useIsTauri";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";

export function HeaderModule({ module }: { module: ModuleSetting }) {
  const { title, description, image } = module;

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  return (
    <div className="flex items-center border p-4 rounded-md  ">
      <div className="ml-2">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm">{description}</p>

        <div className="mt-2">
          <a
            className="btn btn-sm btn-neutral"
            href={`/${module.module}`}
            target="_blank"
            onClick={(e) => {
              if (isTauri) {
                e.preventDefault();
                setDesktopPage({
                  page: DesktopPage.Project,
                  pageParam: module.module,
                });
              }
            }}
          >
            View Collection
          </a>
        </div>
      </div>
      {image && <img src={image} className="w-24" alt={`Logo for ${title}`} />}
    </div>
  );
}
