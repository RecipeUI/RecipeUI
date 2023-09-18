"use client";

import {
  CollectionComponentModule,
  DEFAULT_COMPONENT_MODULES,
  ModuleSetting,
} from "..";
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
  const components = module.components || DEFAULT_COMPONENT_MODULES;

  return (
    <div className="space-y-4 p-4 ">
      {components.map((component, i) => {
        if (component === CollectionComponentModule.Header) {
          return <HeaderModule module={module} key={i} />;
        } else if (component === CollectionComponentModule.Resources) {
          if (!module.resources) {
            return null;
          }

          return <ResourcesModule resourceSection={module.resources} key={i} />;
        } else if (component === CollectionComponentModule.Custom) {
          return <Fragment key={i}>{children}</Fragment>;
        }
      })}
    </div>
  );
}
