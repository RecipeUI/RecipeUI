"use client";
import { useLocalStorage } from "usehooks-ts";
import { LATEST_APP_VERSION } from "../../utils/constants/main";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { isSemverLessThan } from "../../utils/main";
import { useMemo, useState } from "react";

const VERSION_LOGS: {
  version: string;
  update: string;
  update_type?: "bug" | "feature";
  ignore?: boolean;
}[] = [
  {
    version: "0.8.6",
    update: "Nested folders. Improved cloud syncing.",
    update_type: "feature",
  },
  {
    version: "0.8.5",
    update: "Bug fixes and multiple UX improvements. Auth flow improved.",
    update_type: "bug",
  },
  {
    version: "0.8.2",
    update: "Bug fixes. Migrate to API storybook (more details soon).",
    update_type: "bug",
    ignore: true,
  },
  {
    version: "0.8.0",
    update: "Ability to share and publish folders as collections!",
    update_type: "feature",
  },
  {
    version: "0.8.0",
    update: "Add headers to output response.",
    update_type: "feature",
  },
  {
    version: "0.7.7",
    update: "Request history. Preview, replay, and save past request runs!",
    update_type: "feature",
  },
  {
    version: "0.7.6",
    update: "Save requests as recipes that you can replay quickly.",
    update_type: "feature",
  },
];

export function EditorUpdates() {
  const { latestVersionDismiss, isLatest, setToLatestVersion } =
    useLatestVersionDetails();

  const [showMore, setShowMore] = useState(false);

  const versionLogs = useMemo(() => {
    let versionLogs = VERSION_LOGS.filter((log) => {
      if (showMore) {
        return true;
      }

      if (log.ignore) {
        return false;
      }

      if (
        isSemverLessThan({
          oldVer: log.version,
          newVer: latestVersionDismiss,
        })
      ) {
        return false;
      }

      return true;
    });

    if (!showMore) {
      versionLogs = versionLogs.slice(0, 3);
    }
    return versionLogs;
  }, [latestVersionDismiss, showMore]);

  if (isLatest) {
    return null;
  }

  return (
    <section className="space-y-2 flex flex-col border border-dashed border-accent  rounded-md p-4 text-sm mt-12">
      <div className="space-x-2 flex items-center">
        <h1 className="font-bold text-lg">Recent Updates</h1>
      </div>

      <div className="">
        <ul className="list-disc pl-[3%] space-y-2">
          {versionLogs.map((log, i) => {
            return (
              <li key={i}>
                <div className="flex items-start">
                  <span className="font-bold w-[25px]">{log.version}</span>
                  <p className="ml-6 align-middle">
                    {log.update_type === "feature" ? (
                      <span className="badge badge-accent badge-xs text-white inline mr-1 middle">
                        New
                      </span>
                    ) : null}{" "}
                    {log.update}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        {!showMore && (
          <button
            className="underline underline-offset-2 mt-2"
            onClick={() => {
              setShowMore(true);
            }}
          >
            View past updates
          </button>
        )}
      </div>
      <button
        className="btn btn-outline btn-sm w-fit !mt-4 "
        onClick={() => {
          setToLatestVersion();
        }}
      >
        <SparklesIcon className="hidden  w-4 h-4 mr-2" />
        Dismiss
        <SparklesIcon className="hidden  w-4 h-4 mr-2" />
      </button>
    </section>
  );
}

export function useLatestVersionDetails() {
  const [latestVersionDismiss, setLatestVersionDismissed] = useLocalStorage(
    "latestVersion",
    "0.8.0"
  );

  // useEffect(() => {
  //   localStorage.removeItem("latestVersion");
  // }, []);

  return {
    latestVersionDismiss,
    isLatest: !isSemverLessThan({
      oldVer: latestVersionDismiss,
      newVer: LATEST_APP_VERSION,
    }),
    setToLatestVersion: () => {
      setLatestVersionDismissed(LATEST_APP_VERSION);
    },
  };
}
