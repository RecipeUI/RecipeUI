import { Suspense, lazy, useMemo } from "react";
import { CollectionModule } from "../../../modules";
import { Loading } from "../../Loading";

const NASA = lazy(() => import("../../../modules/NASA"));
export function RecipeCustomModule({ module }: { module: CollectionModule }) {
  const ModuleComponent = useMemo(() => {
    if (module === CollectionModule.NASA) {
      return NASA;
    }

    return null;
  }, [module]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Suspense fallback={<Loading />}>
        {ModuleComponent ? <ModuleComponent /> : null}
      </Suspense>
    </div>
  );
}
