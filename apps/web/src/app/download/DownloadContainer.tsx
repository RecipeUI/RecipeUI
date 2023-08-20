"use client";

import classNames from "classnames";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

enum DesktopPlatform {
  MacUniversal = "MacUniversal",
  MacArm = "MacArm",
  Windows = "Windows",
  Ubuntu = "Linux",
  Unknown = "Unknown",
}
interface Icon {
  className?: string;
}
export function AppleIcon({ className }: Icon) {
  return (
    <svg
      viewBox="0 0 163 200"
      className={classNames(
        " w-8 h-fit",
        className ? className : "fill-slate-200"
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_540_468)">
        <path d="M157.562 68.18C156.402 69.08 135.93 80.62 135.93 106.28C135.93 135.96 161.98 146.46 162.76 146.72C162.64 147.36 158.621 161.1 149.025 175.1C140.468 187.42 131.531 199.72 117.936 199.72C104.341 199.72 100.843 191.82 85.1485 191.82C69.8541 191.82 64.4161 199.98 51.9807 199.98C39.5454 199.98 30.8686 188.58 20.8923 174.58C9.33654 158.14 0 132.6 0 108.36C0 69.48 25.2706 48.86 50.1414 48.86C63.3565 48.86 74.3725 57.54 82.6694 57.54C90.5665 57.54 102.882 48.34 117.916 48.34C123.614 48.34 144.087 48.86 157.562 68.18ZM110.779 31.88C116.997 24.5 121.395 14.26 121.395 4.02C121.395 2.6 121.275 1.16 121.015 0C110.899 0.38 98.8634 6.74 91.6061 15.16C85.9082 21.64 80.5901 31.88 80.5901 42.26C80.5901 43.82 80.8501 45.38 80.97 45.88C81.6098 46 82.6494 46.14 83.689 46.14C92.7656 46.14 104.181 40.06 110.779 31.88Z" />
      </g>
      <defs>
        <clipPath id="clip0_540_468">
          <rect width="162.74" height="200" />
        </clipPath>
      </defs>
    </svg>
  );
}

const getContent = (latestVersion: string) => ({
  [DesktopPlatform.MacArm]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_universal.dmg`,
    label: "Mac Apple Chip",
    size: "7mb",
    icon: AppleIcon,
    platform: DesktopPlatform.MacArm,
  },
  [DesktopPlatform.MacUniversal]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_aarch64.dmg`,
    label: "Mac Intel Chip",
    size: "3mb",
    icon: AppleIcon,
    platform: DesktopPlatform.MacUniversal,
  },
  [DesktopPlatform.Windows]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_x64_en-US.msi`,
    label: "Windows ",
    size: "7mb",
    icon: AppleIcon,
    platform: DesktopPlatform.Windows,
  },
  [DesktopPlatform.Ubuntu]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/recipe-ui_${latestVersion}_amd64.deb`,
    label: "Ubuntu",
    size: "9mb",
    icon: AppleIcon,
    platform: DesktopPlatform.Ubuntu,
  },
});

export function DownloadContainer({
  latestVersion,
}: {
  latestVersion: string;
}) {
  const [platform, setPlatform] = useState<DesktopPlatform>(
    DesktopPlatform.Unknown
  );
  useEffect(() => {
    async function getPlatform() {
      // Strong if userAgentData, but not supported in Firefox/Safari
      if ("userAgentData" in navigator) {
        const data = await (
          navigator as any
        ).userAgentData.getHighEntropyValues(["architecture"]);

        if (data.platform === "macOS") {
          if (data.architecture === "arm") {
            setPlatform(DesktopPlatform.MacArm);
          } else {
            setPlatform(DesktopPlatform.MacUniversal);
          }
        } else if (data.platform === "Windows") {
          setPlatform(DesktopPlatform.Windows);
        }
      } else {
        const userAgent = navigator.userAgent;

        if (userAgent.includes("Mac")) {
          if (navigator.userAgent.match(/OS X 10_([789]|1[01234])/)) {
            setPlatform(DesktopPlatform.MacArm);
          } else {
            setPlatform(DesktopPlatform.MacUniversal);
          }
        } else if (userAgent.includes("Windows")) {
          setPlatform(DesktopPlatform.Windows);
        }
      }
    }

    getPlatform();
  }, []);

  const content = getContent(latestVersion);

  return (
    <div className="m-12">
      <div className="bg-yellow-200 dark:bg-yellow-200/80 p-6 sm:p-8 rounded-md mb-4 dark:text-black">
        <h1 className="font-bold text-3xl">Download RecipeUI</h1>
        <p className="my-2 sm:text-base text-lg">
          Our open sourced desktop app is{" "}
          <span className="font-bold italic">
            {"blazingly fast and lightweight (<10mb)"}
          </span>
          . We leverage the latest technology in the open source community, like
          Tauri Rust and NextJS, to build a truly modern app compatible on all
          desktop and browser platforms.
        </p>
        {/* <div className="space-x-2">
          <Link
            className="btn btn-neutral mt-2"
            target="_blank"
            href="https://github.com/RecipeUI/RecipeUI/releases/latest"
          >
            Download latest
          </Link>
          <Link
            className="btn btn-neutral mt-2"
            href="https://github.com/RecipeUI/RecipeUI"
          >
            View Code
          </Link>
        </div> */}

        <p className="mt-6">Choose a platform below to download.</p>
        <div className="grid sm:grid-cols-2 xl:lg-grid-cols-4 gap-6 mt-4">
          {Object.values(content).map((item) => {
            const Icon = item.icon;
            const isSelected = item.platform === platform;
            return (
              <Link
                key={item.href}
                href={item.href}
                target="_blank"
                className={classNames(
                  "border border-recipe-slate rounded-md p-4 cursor-pointer recipe-container-box flex flex-row items-center",
                  isSelected
                    ? "!bg-accent !border-none text-black -order-1"
                    : ""
                )}
              >
                <Icon className={isSelected ? "fill-slate-black" : ""} />
                <h3
                  className={classNames(
                    "font-bold ml-8 ",
                    isSelected ? "text-black" : "text-slate-200"
                  )}
                >
                  {item.label} ({item.size})
                </h3>
                <div className="flex-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
