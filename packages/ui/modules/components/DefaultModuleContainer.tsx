"use client";

import { CollectionModule } from "types/modules";
import { ComponentModuleContainer } from "../components/ComponentModuleContainer";
import { ModuleSettings } from "../authConfigs";
import { DiscordLink } from "../../components/CommonLinks";

export function DefaultModuleContainer({
  module,
}: {
  module: CollectionModule;
}) {
  const ModuleSetting = ModuleSettings[module];

  if (!ModuleSetting) {
    return (
      <div className="p-4">
        No Module setup. Please report to our <DiscordLink />.
      </div>
    );
  }

  return <ComponentModuleContainer module={ModuleSetting} />;
}
