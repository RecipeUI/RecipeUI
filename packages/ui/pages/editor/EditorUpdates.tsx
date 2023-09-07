"use client";
import { useLocalStorage } from "usehooks-ts";
import { LATEST_APP_VERSION } from "../../utils/constants/main";
import { useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { isSemverLessThan } from "../../utils/main";

const VERSION_LOGS: {
  version: string;
  update: string;
}[] = [
  {
    version: "0.7.7",
    update: "Request history. Preview, replay, and save past request runs!",
  },
  {
    version: "0.7.6",
    update: "Allow recipe save once a request is made.",
  },
  {
    version: "0.7.5",
    update: "No one should see this.",
  },
];

export function EditorUpdates() {
  const [latestVersionDismiss, setLatestVersionDismissed] = useLocalStorage<
    undefined | string
  >("latestVersion", "0.7.6");

  if (
    latestVersionDismiss == undefined ||
    latestVersionDismiss === LATEST_APP_VERSION
  ) {
    return null;
  }

  return (
    <section className="space-y-2 flex flex-col border border-dashed rounded-md p-4 text-sm mt-12">
      <div className="space-x-2 flex items-center">
        <h1 className="font-bold text-lg">Recent Updates</h1>
      </div>

      <div className="flex flex-col gap-4">
        <ul className="list-disc pl-[3%]">
          {VERSION_LOGS.map((log) => {
            if (
              isSemverLessThan({
                oldVer: log.version,
                newVer: latestVersionDismiss,
              })
            ) {
              return null;
            }

            return (
              <li key={log.version}>
                <div className="flex items-center">
                  <span className="font-bold w-[25px]">{log.version}</span>
                  <span className="ml-6">{log.update}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <button
        className="btn btn-outline btn-sm w-fit !mt-4 group"
        onClick={() => {
          setLatestVersionDismissed(LATEST_APP_VERSION);
        }}
      >
        <SparklesIcon className="hidden group-hover:block group-hover:animate-spin w-4 h-4 mr-2" />
        Dismiss
        <SparklesIcon className="hidden group-hover:block group-hover:animate-spin w-4 h-4 mr-2" />
      </button>
    </section>
  );
}
