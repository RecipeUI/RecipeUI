"use client";
import { useLocalStorage } from "usehooks-ts";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { isSemverLessThan } from "../../utils/main";
import { useEffect, useMemo, useState } from "react";
import {
  DiscordLink,
  GitHubLink,
  GoogleFormLink,
} from "../../components/CommonLinks";
import { LATEST_APP_VERSION, VERSION_LOGS } from "utils/constants/updates";

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
      <p className="pt-4">
        Expect <span className="font-bold">daily updates</span> for the next few
        weeks until v1.0. We're rapidly trying to fix bugs, improve the UX, and
        add new features. Please report bugs on <DiscordLink />, <GitHubLink />,
        or <GoogleFormLink /> so we can respond to them quickly.
      </p>

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

  useEffect(() => {
    localStorage.removeItem("latestVersion");
  }, []);

  const isLatest = !isSemverLessThan({
    oldVer: latestVersionDismiss,
    newVer: LATEST_APP_VERSION,
  });

  return {
    latestVersionDismiss,
    isLatest: isLatest,
    setToLatestVersion: () => {
      setLatestVersionDismissed(LATEST_APP_VERSION);
    },
  };
}
