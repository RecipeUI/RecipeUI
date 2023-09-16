"use client";

import { CollectionComponentModule, ModuleSetting } from "..";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import ModuleSettings from "../nasa/settings";
import { ResourcesModule } from "./ResourcesModule";
import { HeaderModule } from "./HeaderModule";
import { Fragment, ReactNode } from "react";

export function ComponentModuleContainer({
  module,
  children,
}: {
  module: ModuleSetting;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4 p-4 ">
      {module.components.map((component, i) => {
        if (component === CollectionComponentModule.Header) {
          return <HeaderModule module={ModuleSettings} key={i} />;
        } else if (component === CollectionComponentModule.Resources) {
          if (!ModuleSettings.resources)
            return (
              <div className="alert alert-error flex items-center gap-x-2 mb-4">
                <InformationCircleIcon className="h-6" />
                <span className="mt-0.5">
                  No resources define in settings.ts
                </span>
              </div>
            );
          return (
            <ResourcesModule
              resourceSection={ModuleSettings.resources}
              key={i}
            />
          );
        } else if (component === CollectionComponentModule.Custom) {
          return <Fragment key={i}>{children}</Fragment>;
        }
      })}
    </div>
  );
}
