import { Suspense, lazy, useMemo } from "react";
import { Loading } from "../../Loading";
import { DefaultModuleContainer } from "../../../modules/components/DefaultModuleContainer";
import { CollectionModule } from "types/modules";

const NASA = lazy(() => import("../../../modules/NASA"));

export function RecipeCustomModule({ module }: { module: CollectionModule }) {
  const ModuleComponent = useMemo(() => {
    if (module === CollectionModule.NASA) {
      return NASA;
    } else if (module === CollectionModule.GIPHY) {
      // return GIPHY;
    }

    return null;
  }, [module]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<Loading />}>
        {ModuleComponent ? (
          <ModuleComponent />
        ) : (
          <DefaultModuleContainer module={module} />
        )}
      </Suspense>
    </div>
  );
}
