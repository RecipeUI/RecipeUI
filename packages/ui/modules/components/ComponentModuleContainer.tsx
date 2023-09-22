"use client";

import {
  CollectionComponentModule,
  DEFAULT_COMPONENT_MODULES,
} from "types/modules";
import { ResourcesModule } from "./ResourcesModule";
import { HeaderModule } from "./HeaderModule";
import { Fragment, ReactNode } from "react";
import { ModuleSetting } from "types/database";
import { RecipeAuthType } from "types/enums";
import { SingleAuthModule } from "./AuthModule";

export function ComponentModuleContainer({
  module,
  moduleComponentMapping = {},
}: {
  module: ModuleSetting;
  moduleComponentMapping?: {
    [key in CollectionComponentModule]?: ReactNode;
  };
}) {
  const components = module.components || DEFAULT_COMPONENT_MODULES;

  return (
    <div className="space-y-4 p-4 ">
      {components.map((component, i) => {
        const Component = moduleComponentMapping[component];

        if (Component) {
          return <Fragment key={i}>{Component}</Fragment>;
        } else if (component === CollectionComponentModule.Header) {
          return <HeaderModule module={module} key={i} />;
        } else if (component === CollectionComponentModule.Resources) {
          if (!module.resources) {
            return null;
          }

          return <ResourcesModule resourceSection={module.resources} key={i} />;
        } else if (component === CollectionComponentModule.Auth) {
          if (!module.authConfig) return null;
          return module.authConfig ? (
            <Fragment key={i}>
              {module.authConfig.type !== RecipeAuthType.Multiple ? (
                <SingleAuthModule
                  authConfig={module.authConfig}
                  module={module.module}
                />
              ) : (
                <div>Multiple config not supported yet</div>
              )}
            </Fragment>
          ) : null;
        }

        return null;
      })}
    </div>
  );
}
