"use client";

import classNames from "classnames";
import Link from "next/link";
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DesktopAppUpsell } from "../../../ui/pages/editor/EditorPage";
import { useDarkMode } from "usehooks-ts";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../utils/constants/posthog";
import {
  CodeBracketIcon,
  CodeBracketSquareIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { useIsMobile } from "../../hooks";
import { useQuery } from "@tanstack/react-query";
import { RecipeNativeFetchContext } from "../../state/recipeSession";
import { RecipeMethod } from "types/enums";
import { APP_GITHUB_LATEST_RELEASE_URL } from "../../utils/constants/main";

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
function AppleIcon({ className }: Icon) {
  return (
    <svg
      viewBox="0 0 163 200"
      className={classNames(
        "w-4 h-fit mb-1",
        className ? className : "fill-slate-200"
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_540_468)">
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

function WindowsIcon({ className }: Icon) {
  return (
    <svg
      viewBox="0 0 88 88"
      xmlns="http://www.w3.org/2000/svg"
      className={classNames(
        "w-4 h-fit",
        className ? className : "fill-slate-200"
      )}
    >
      <path d="M0 12.402L35.687 7.542L35.703 41.965L0.033 42.168L0 12.402ZM35.67 45.931L35.698 80.384L0.028 75.48L0.026 45.7L35.67 45.931ZM39.996 6.906L87.314 0V41.527L39.996 41.903V6.906ZM87.325 46.255L87.314 87.595L39.996 80.917L39.93 46.178L87.325 46.255Z" />
    </svg>
  );
}

function DebianLinux({ className }: Icon) {
  return (
    <svg
      viewBox="0 0 88 109"
      xmlns="http://www.w3.org/2000/svg"
      className={classNames(
        "w-4 h-fit",
        className ? className : "fill-slate-200"
      )}
    >
      <g clipPath="url(#clip0_546_488)">
        <path d="M51.986 57.2974C50.189 57.3224 52.326 58.2234 54.672 58.5844C55.32 58.0784 55.908 57.5664 56.432 57.0684C54.971 57.4264 53.484 57.4344 51.986 57.2974Z" />
        <path d="M61.631 54.893C62.701 53.416 63.481 51.799 63.756 50.127C63.516 51.319 62.869 52.348 62.26 53.434C58.901 55.549 61.944 52.178 62.258 50.897C58.646 55.443 61.762 53.623 61.631 54.893Z" />
        <path d="M65.1911 45.6286C65.4081 42.3926 64.5541 43.4156 64.2671 44.6506C64.6021 44.8246 64.8671 46.9316 65.1911 45.6286Z" />
        <path d="M45.1721 1.39844C46.1311 1.57044 47.2441 1.70244 47.0881 1.93144C48.1371 1.70144 48.3751 1.48944 45.1721 1.39844Z" />
        <path d="M47.0882 1.93164L46.4102 2.07164L47.0412 2.01564L47.0882 1.93164Z" />
        <path d="M76.9921 46.8564C77.0991 49.7624 76.1421 51.1724 75.2791 53.6684L73.7261 54.4444C72.4551 56.9124 73.8491 56.0114 72.9391 57.9744C70.9551 59.7384 66.9181 63.4944 65.6261 63.8374C64.6831 63.8164 66.2651 62.7244 66.4721 62.2964C63.8161 64.1204 64.3411 65.0344 60.2791 66.1424L60.1601 65.8784C50.1421 70.5914 36.2261 61.2514 36.4091 48.5074C36.3021 49.3164 36.1051 49.1144 35.8831 49.4414C35.3661 42.8844 38.9111 36.2984 44.8901 33.6094C50.7381 30.7144 57.5941 31.9024 61.7831 35.8064C59.4821 32.7924 54.9021 29.5974 49.4741 29.8964C44.1571 29.9804 39.1831 33.3594 37.5231 37.0274C34.7991 38.7424 34.4831 43.6384 33.2961 44.5344C31.6991 56.2714 36.3001 61.3424 44.0831 67.3074C45.3081 68.1334 44.4281 68.2584 44.5941 68.8874C42.0081 67.6764 39.6401 65.8484 37.6931 63.6104C38.7261 65.1224 39.8411 66.5924 41.2821 67.7474C38.8441 66.9214 35.5871 61.8394 34.6361 61.6324C38.8391 69.1574 51.6881 74.8294 58.4161 72.0154C55.3031 72.1304 51.3481 72.0794 47.8501 70.7864C46.3811 70.0304 44.3831 68.4644 44.7401 68.1714C53.9221 71.6014 63.4071 70.7694 71.3521 64.4004C73.3731 62.8264 75.5811 60.1484 76.2191 60.1114C75.2581 61.5564 76.3831 60.8064 75.6451 62.0824C77.6591 58.8344 74.7701 60.7604 77.7271 56.4734L78.8191 57.9774C78.4131 55.2814 82.1671 52.0074 81.7861 47.7434C82.6471 46.4394 82.7471 49.1464 81.8331 52.1464C83.1011 48.8184 82.1671 48.2834 82.4931 45.5374C82.8451 46.4604 83.3071 47.4414 83.5441 48.4154C82.7181 45.1994 84.3921 42.9994 84.8061 41.1304C84.3981 40.9494 83.5311 42.5524 83.3331 38.7534C83.3621 37.1034 83.7921 37.8884 83.9581 37.4824C83.6341 37.2964 82.7841 36.0314 82.2671 33.6054C82.6421 33.0354 83.2691 35.0834 83.7791 35.1674C83.4511 33.2384 82.8861 31.7674 82.8631 30.2874C81.3731 27.1734 82.3361 30.7024 81.1271 28.9504C79.5411 24.0034 82.4431 27.8024 82.6391 25.5544C85.0431 29.0374 86.4141 34.4354 87.0431 36.6714C86.5631 33.9454 85.7871 31.3044 84.8401 28.7494C85.5701 29.0564 83.6641 23.1404 85.7891 27.0584C83.5191 18.7064 76.0741 10.9024 69.2251 7.24044C70.0631 8.00744 71.1211 8.97044 70.7411 9.12144C67.3351 7.09344 67.9341 6.93544 67.4461 6.07844C64.6711 4.94944 64.4891 6.16944 62.6511 6.08044C57.4211 3.30644 56.4131 3.60144 51.6001 1.86344L51.8191 2.88644C48.3541 1.73244 47.7821 3.32444 44.0371 2.89044C43.8091 2.71244 45.2371 2.24644 46.4121 2.07544C43.0621 2.51744 43.2191 1.41544 39.9411 2.19744C40.7491 1.63044 41.6031 1.25544 42.4651 0.773438C39.7331 0.939437 35.9431 2.36344 37.1131 1.06844C32.6571 3.05644 24.7431 5.84744 20.3021 10.0114L20.1621 9.07844C18.1271 11.5214 11.2881 16.3744 10.7431 19.5384L10.1991 19.6654C9.14013 21.4584 8.45513 23.4904 7.61513 25.3354C6.23013 27.6954 5.58513 26.2434 5.78213 26.6134C3.05813 32.1364 1.70513 36.7774 0.536133 40.5834C1.36913 41.8284 0.556133 48.0784 0.871133 53.0804C-0.496867 77.7844 18.2091 101.77 38.6561 107.308C41.6531 108.38 46.1101 108.339 49.9011 108.449C45.4281 107.17 44.8501 107.771 40.4931 106.252C37.3501 104.772 36.6611 103.082 34.4351 101.15L35.3161 102.707C30.9501 101.162 32.7771 100.795 29.2251 99.6704L30.1661 98.4414C28.7511 98.3344 26.4181 96.0564 25.7801 94.7954L24.2321 94.8564C22.3721 92.5614 21.3811 90.9074 21.4531 89.6264L20.9531 90.5174C20.3861 89.5444 14.1101 81.9104 17.3661 83.6874C16.7611 83.1344 15.9571 82.7874 15.0851 81.2034L15.7481 80.4454C14.1811 78.4294 12.8641 75.8454 12.9641 74.9844C13.8001 76.1134 14.3801 76.3244 14.9541 76.5174C10.9971 66.6994 10.7751 75.9764 7.77813 66.5234L8.41213 66.4724C7.92613 65.7404 7.63113 64.9454 7.24013 64.1654L7.51613 61.4154C4.66713 58.1214 6.71913 47.4094 7.13013 41.5344C7.41513 39.1454 9.50813 36.6024 11.1001 32.6144L10.1301 32.4474C11.9841 29.2134 20.7161 19.4594 24.7601 19.9614C26.7191 17.5004 24.3711 19.9524 23.9881 19.3324C28.2911 14.8794 29.6441 16.1864 32.5481 15.3854C35.6801 13.5264 29.8601 16.1104 31.3451 14.6764C36.7591 13.2934 35.1821 11.5324 42.2451 10.8304C42.9901 11.2544 40.5161 11.4854 39.8951 12.0354C44.4061 9.82844 54.1701 10.3304 60.5121 13.2604C67.8711 16.6994 76.1391 26.8654 76.4651 36.4304L76.8361 36.5304C76.6481 40.3324 77.4181 44.7294 76.0841 48.7684L76.9921 46.8564Z" />
        <path d="M32.3721 59.7637L32.1201 61.0237C33.3011 62.6277 34.2381 64.3657 35.7461 65.6197C34.6611 63.5017 33.8551 62.6267 32.3721 59.7637Z" />
        <path d="M35.1641 59.6547C34.5391 58.9637 34.1691 58.1317 33.7551 57.3027C34.1511 58.7597 34.9621 60.0117 35.7171 61.2847L35.1641 59.6547Z" />
        <path d="M84.5681 48.916L84.3041 49.578C83.8201 53.016 82.7751 56.418 81.1731 59.572C82.9431 56.244 84.0881 52.604 84.5681 48.916Z" />
        <path d="M45.5271 0.537C46.7421 0.092 48.5141 0.293 49.8031 0C48.1231 0.141 46.451 0.225 44.8 0.438L45.5271 0.537Z" />
        <path d="M2.87198 23.2188C3.15198 25.8108 0.921976 26.8167 3.36598 25.1077C4.67598 22.1567 2.85398 24.2928 2.87198 23.2188Z" />
        <path d="M7.7799e-05 35.2152C0.563078 33.4872 0.665078 32.4492 0.880078 31.4492C-0.675922 33.4382 0.164078 33.8622 7.7799e-05 35.2152Z" />
      </g>
      <defs>
        <clipPath id="clip0_546_488">
          <rect width="87.041" height="108.445" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

const getContent = (latestVersion: string) => ({
  [DesktopPlatform.MacArm]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_aarch64.dmg`,
    label: "Mac Apple Chip",
    icon: AppleIcon,
    platform: DesktopPlatform.MacArm,
    rank: 1,
  },
  [DesktopPlatform.MacUniversal]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_universal.dmg`,
    label: "Mac Intel Chip",
    icon: AppleIcon,
    platform: DesktopPlatform.MacUniversal,
    rank: 2,
  },
  [DesktopPlatform.Windows]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/RecipeUI_${latestVersion}_x64_en-US.msi`,
    label: "Windows ",
    icon: WindowsIcon,
    platform: DesktopPlatform.Windows,
    rank: 3,
  },
  [DesktopPlatform.Ubuntu]: {
    href: `https://github.com/RecipeUI/RecipeUI/releases/download/app-v${latestVersion}/recipe-ui_${latestVersion}_amd64.deb`,
    label: "Debian Linux",
    icon: DebianLinux,
    platform: DesktopPlatform.Ubuntu,
    rank: 4,
  },
});

export function DownloadContainer() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen sm:flex sm:flex-col lg:grid grid-cols-5 relative">
      <div className="m-6 sm:m-8 lg:text-base lg:m-12 col-span-2 flex flex-col justify-center items-center relative text-sm   sm:text-lg">
        <div className="rounded-md mb-4 dark:text-white h-fit space-y-4">
          <h1 className="font-bold text-xl lg:text-3xl">RecipeUI</h1>
          <p className="my-2 ">
            Powered by{" "}
            <span className="text-blue-600 font-bold underline underline-offset-2">
              TypeScript
            </span>
            , testing and sharing APIs have never been easier with our
            auto-complete, statically-typed editor.
          </p>
          <DesktopAppUpsell nextBlack />
          <DesktopDownload />
          {/* <ViewCollections /> */}
        </div>
      </div>
      <div className="col-span-3 relative overflow-hidden">
        <div className="lg:absolute inset-0 flex justify-center items-center lg:m-4 lg:mr-0 ">
          <img
            className="!h-full object-cover object-left bg-none"
            src={!isDarkMode ? "/LightApp.png" : "/DarkApp.png"}
            alt="Screenshot of Desktop app"
          />
        </div>
      </div>
    </div>
  );
}

function ViewCollections() {
  const [dismiss, setDismiss] = useState(false);

  useEffect(() => {}, []);

  return (
    <div className="absolute bottom-0 left-0 h-[40px] bg-accent rounded-t-lg  justify-center items-center text-sm px-2 text-black hidden lg:flex">
      View Collections
    </div>
  );
}

const LATEST_VERSION = "0.5.5";
function DesktopDownload() {
  const [showAll, setShowAll] = useState(true);

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

  const [latestVersion, setLatestVersion] = useState(LATEST_VERSION);
  const nativeFetch = useContext(RecipeNativeFetchContext);
  useQuery({
    queryKey: ["latestVersion", nativeFetch],
    queryFn: async () => {
      if (!nativeFetch) {
        return LATEST_VERSION;
      }

      const latestRes = await nativeFetch({
        url: APP_GITHUB_LATEST_RELEASE_URL,
        payload: {
          headers: {},
          method: RecipeMethod.GET,
          body: undefined,
        },
      });

      if (latestRes.status === 200) {
        try {
          const latestJson = JSON.parse(latestRes.output);
          setLatestVersion(latestJson.version);

          return latestJson.version;
        } catch (e) {
          console.error(e);
        }
      }

      return LATEST_VERSION;
    },
  });

  const content = getContent(latestVersion);

  const platformInfo = useMemo(() => {
    const _platforms = Object.values(content);

    _platforms.sort((a, b) => {
      if (a.platform === platform) {
        return 1;
      } else if (b.platform === platform) {
        return 1;
      } else {
        return a.rank - b.rank;
      }
    });

    if (showAll) {
      return _platforms;
    }
    if (
      platform === DesktopPlatform.MacArm ||
      platform === DesktopPlatform.MacUniversal
    ) {
      return _platforms.filter((item) => {
        return (
          item.platform === DesktopPlatform.MacArm ||
          item.platform === DesktopPlatform.MacUniversal
        );
      });
    }

    return _platforms.slice(0, 1);
  }, [content, platform, showAll]);

  const [showInitialWeb, setShowInitialWeb] = useState(true);
  const [showAdvancedWeb, setShowAdvancedWeb] = useState(false);

  const router = useRouter();
  const posthog = usePostHog();

  const isMobile = useIsMobile();

  const buttonClassName =
    "btn-accent btn dark:text-slate-200 rounded-md w-full";

  if (showInitialWeb) {
    const collections = (
      <Link
        href="/collections"
        className={buttonClassName}
        onClick={() => {
          posthog?.capture(POST_HOG_CONSTANTS.TRY_WEB);
        }}
      >
        Web Collections
      </Link>
    );
    if (showAdvancedWeb) {
      return (
        <ButtonGrid>
          <Link
            href="/editor"
            className={buttonClassName}
            onClick={() => {
              posthog?.capture(POST_HOG_CONSTANTS.TRY_WEB);
            }}
          >
            Web Editor
          </Link>
          {collections}
        </ButtonGrid>
      );
    }

    return (
      <ButtonGrid>
        <button
          className={buttonClassName}
          onClick={() => {
            setShowInitialWeb(false);
          }}
        >
          Try Desktop (20 mb!)
        </button>
        {!isMobile ? (
          <button
            className={buttonClassName}
            onClick={() => {
              setShowAdvancedWeb(true);
            }}
          >
            Try Web
          </button>
        ) : (
          collections
        )}
      </ButtonGrid>
    );
  }

  return (
    <>
      <ButtonGrid>
        {platformInfo.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              target="_blank"
              className={classNames(buttonClassName)}
              onClick={() => {
                posthog?.capture(POST_HOG_CONSTANTS.DOWNLOAD, {
                  platform: item.platform,
                });
              }}
            >
              <Icon className="fill-black dark:fill-gray-200 hidden sm:block" />
              <h3 className={classNames("font-bold")}>{item.label}</h3>
            </Link>
          );
        })}
      </ButtonGrid>
      <button
        className="text-xs text-left mt-4"
        onClick={() => {
          if (!showAll) {
            setShowAll(true);
          } else {
            posthog?.capture(POST_HOG_CONSTANTS.DOWNLOAD, {
              platform: "CHOOSING",
            });

            window.open(
              "https://github.com/RecipeUI/RecipeUI/releases/latest",
              "_blank"
            );
          }
        }}
      >
        {showAll ? (
          <>
            See more options on <span className="underline">Github</span>.
          </>
        ) : (
          <>
            Not your OS? Click <span className="underline">here</span> to see
            more options.
          </>
        )}
      </button>
    </>
  );
}

function ButtonGrid({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col sm:grid grid-cols-2 gap-2 mt-4 w-full text-xs">
      {children}
    </div>
  );
}
