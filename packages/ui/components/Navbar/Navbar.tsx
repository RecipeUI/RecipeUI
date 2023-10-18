"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  DesktopPage,
  RecipeNativeFetchContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useCallback, useContext, useEffect, useState } from "react";

import { Bars3Icon, StarIcon } from "@heroicons/react/24/outline";
import { User } from "types/database";
import Link from "next/link";
import {
  APP_COOKIE,
  APP_GITHUB_LATEST_RELEASE_URL,
  UNIQUE_ELEMENT_IDS,
} from "../../utils/constants/main";
import { OnboardingFlow } from "./OnboardingFlow";
import NavAuthForm from "./NavAuthForm";

import Cookie from "js-cookie";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import classNames from "classnames";
import { useIsTauri } from "../../hooks/useIsTauri";

export function Navbar() {
  const userSession = useRecipeSessionStore((state) => state.userSession);

  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (userSession) {
      setShowForm(false);
    }
  }, [userSession]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);

  const onboarding = useRecipeSessionStore((state) => state.onboarding);

  const isTauri = useIsTauri();

  const router = useRouter();

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const pathName = usePathname();

  const goCollections = useCallback(() => {
    setCurrentSession(null);

    if (isTauri) {
      setDesktopPage(null);
    } else {
      if (pathName === "/") {
        location.reload();
      } else {
        router.push("/");
      }
    }
  }, [isTauri, pathName, router, setCurrentSession, setDesktopPage]);

  const goEditor = useCallback(() => {
    setCurrentSession(null);

    if (isTauri) {
      setDesktopPage({
        page: DesktopPage.Editor,
      });
    } else {
      router.push("/editor");
    }
  }, [isTauri, router, setCurrentSession, setDesktopPage]);

  const { isLatest } = useLatestVersionDetails();

  return (
    <div
      className={classNames(
        "py-2 sm:py-0 w-full flex justify-between min-h-12 items-center font-bold shadow-sm px-4 text-black sticky top-0 z-10 bg-white dark:bg-base-100 border-b border-slate-200 dark:border-slate-600"
      )}
    >
      <div className={classNames("flex text-sm items-center")}>
        <button
          className={classNames(
            "cursor-pointer flex items-center",
            process.env.NEXT_PUBLIC_ENV === "dev" &&
              "bg-accent rounded-md p-1 pl-2"
          )}
          onClick={() => {
            if (isTauri) {
              goEditor();
            } else {
              goCollections();
            }
          }}
        >
          <svg
            width="23px"
            height="23px"
            viewBox="0 0 27 28"
            className="fill-black dark:fill-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_139_8382)">
              <path d="M10.475 22.5431C10.3867 22.4543 10.2815 22.3838 10.1657 22.3357C10.0498 22.2876 9.92553 22.2628 9.8 22.2628C9.67447 22.2628 9.55018 22.2876 9.43433 22.3357C9.31847 22.3838 9.21333 22.4543 9.125 22.5431L7.55625 24.0738C7.27573 24.3537 7.11819 24.733 7.11819 25.1284C7.11819 25.5239 7.27573 25.9032 7.55625 26.1831L9.08125 27.7511C9.17055 27.8425 9.27749 27.915 9.39564 27.9641C9.51378 28.0133 9.64069 28.0382 9.76875 28.0373C10.0164 28.0388 10.2546 27.9426 10.4313 27.7698C10.5206 27.6813 10.5916 27.5761 10.64 27.4603C10.6884 27.3444 10.7133 27.2202 10.7133 27.0947C10.7133 26.9692 10.6884 26.8449 10.64 26.7291C10.5916 26.6132 10.5206 26.508 10.4313 26.4196L9.18125 25.1751L10.4313 23.9307C10.5301 23.8452 10.6101 23.7402 10.6663 23.6225C10.7225 23.5047 10.7536 23.3767 10.7577 23.2464C10.7618 23.1161 10.7388 22.9864 10.6902 22.8654C10.6415 22.7443 10.5683 22.6346 10.475 22.5431Z" />
              <path d="M17.1875 22.5431C17.0992 22.4543 16.994 22.3838 16.8782 22.3357C16.7623 22.2876 16.638 22.2628 16.5125 22.2628C16.387 22.2628 16.2627 22.2876 16.1468 22.3357C16.031 22.3838 15.9258 22.4543 15.8375 22.5431C15.6585 22.7226 15.558 22.9653 15.558 23.2182C15.558 23.4712 15.6585 23.7138 15.8375 23.8933L17.0875 25.1378L15.8375 26.3822C15.6604 26.5615 15.5611 26.8028 15.5611 27.0542C15.5611 27.3056 15.6604 27.547 15.8375 27.7262C15.9268 27.8176 16.0337 27.8901 16.1519 27.9392C16.27 27.9884 16.3969 28.0133 16.525 28.0125C16.7727 28.0139 17.0108 27.9177 17.1875 27.7449L18.7625 26.2142C19.0415 25.9335 19.198 25.5545 19.198 25.1595C19.198 24.7646 19.0415 24.3856 18.7625 24.1049L17.1875 22.5431Z" />
              <path d="M13.9 22.2693C13.7785 22.2364 13.6517 22.2276 13.5268 22.2436C13.4019 22.2596 13.2815 22.2999 13.1723 22.3624C13.0631 22.4248 12.9674 22.5081 12.8906 22.6074C12.8139 22.7068 12.7576 22.8203 12.725 22.9413L11.6687 26.7991C11.6017 27.0425 11.6344 27.3025 11.7599 27.5218C11.8853 27.7412 12.093 27.902 12.3375 27.9689C12.4204 27.9811 12.5046 27.9811 12.5875 27.9689C12.7994 27.9792 13.0086 27.9187 13.1819 27.7969C13.3552 27.6751 13.4826 27.4991 13.5437 27.2969L14.5937 23.4391C14.6265 23.3169 14.6345 23.1895 14.6173 23.0642C14.6001 22.9389 14.5579 22.8182 14.4933 22.7093C14.4287 22.6004 14.343 22.5054 14.2411 22.4299C14.1393 22.3544 14.0233 22.2998 13.9 22.2693Z" />
              <path d="M26.2187 10.0489C26.2187 9.97422 26.2187 9.89956 26.2187 9.81867C26.2187 9.73778 26.2187 9.59467 26.2187 9.47644V9.33334C26.2132 8.92981 26.1692 8.52771 26.0875 8.13244C26.0021 7.70608 25.8744 7.28922 25.7062 6.888L25.6625 6.79467C25.6 6.65778 25.5312 6.52089 25.4625 6.384L25.3437 6.16622L25.1875 5.91111C24.9795 5.58388 24.7454 5.27384 24.4875 4.984L24.3625 4.85334L24.1187 4.61066L23.9125 4.424L23.7187 4.24978C23.1753 3.80466 22.5687 3.44192 21.9187 3.17333C20.8513 2.72075 19.6797 2.56796 18.5312 2.73156C17.5497 1.41441 16.1178 0.500515 14.5058 0.162356C12.8938 -0.175804 11.2132 0.0851676 9.78124 0.896004C9.66323 0.956325 9.54848 1.02278 9.43749 1.09511L9.28749 1.20089C9.13124 1.30666 8.97499 1.41867 8.83124 1.53689L8.56874 1.77333C8.49999 1.83555 8.42499 1.89777 8.36249 1.96622C8.11944 2.20497 7.89386 2.46074 7.68749 2.73156C6.53898 2.5686 5.36758 2.72137 4.29999 3.17333C3.64925 3.4431 3.04257 3.80801 2.49999 4.256L2.30624 4.424C2.23957 4.47793 2.17082 4.54014 2.09999 4.61066C2.02915 4.68118 1.9479 4.76208 1.85624 4.85334L1.73124 4.99022C1.47868 5.27477 1.24882 5.57851 1.04374 5.89867C0.993739 5.98578 0.937489 6.06667 0.887489 6.16C0.837489 6.25333 0.806239 6.29689 0.768739 6.37155C0.731239 6.44622 0.63124 6.64533 0.56874 6.78222L0.531239 6.87556C0.361057 7.2766 0.231256 7.69345 0.143739 8.12C0.0599351 8.51508 0.0138955 8.91717 0.00623871 9.32089V9.47644C0.00623871 9.59467 0.00623871 9.70667 0.00623871 9.81867C-0.000167135 9.89528 -0.000167135 9.97228 0.00623871 10.0489C0.00623871 10.2542 0.049988 10.4533 0.081238 10.6711C0.0841621 10.6834 0.0841621 10.6962 0.081238 10.7084C0.333921 12.0855 1.01149 13.3499 2.01966 14.3257C3.02783 15.3015 4.31646 15.9402 5.70624 16.1529H5.78124V18.8098C5.78124 19.3923 6.01368 19.951 6.42743 20.3629C6.84119 20.7748 7.40235 21.0062 7.98749 21.0062H17.8437C18.4289 21.0062 18.99 20.7748 19.4038 20.3629C19.8175 19.951 20.05 19.3923 20.05 18.8098V16.1653C20.2344 16.1521 20.418 16.1293 20.6 16.0969H20.6437C21.9987 15.862 23.2497 15.2217 24.23 14.2612C25.2103 13.3008 25.8735 12.0659 26.1312 10.7209C26.1312 10.7209 26.1312 10.7209 26.1312 10.6836C26.1687 10.4596 26.2 10.2542 26.2187 10.0489ZM17.8437 19.1271H8.04374C8.00464 19.1279 7.96577 19.121 7.92941 19.1067C7.89304 19.0923 7.85992 19.0709 7.83197 19.0437C7.80403 19.0164 7.78183 18.9839 7.76668 18.948C7.75153 18.9121 7.74373 18.8736 7.74374 18.8347V16.1342C8.96249 15.9572 10.1086 15.4491 11.0562 14.6658L11.7875 14.0436L10.5687 12.5876L9.83749 13.2098C9.15219 13.7647 8.32798 14.1234 7.45338 14.2471C6.57878 14.3709 5.68684 14.2551 4.87335 13.9122C4.05987 13.5693 3.35558 13.0123 2.83612 12.3009C2.31667 11.5896 2.00168 10.7508 1.92499 9.87467V9.76889C1.91868 9.6549 1.91868 9.54065 1.92499 9.42666C1.92499 9.37066 1.92499 9.30844 1.92499 9.25244C1.92499 9.09689 1.92499 8.94133 1.96874 8.792C2.01249 8.64266 1.96874 8.66133 1.99999 8.59911C2.13636 7.93652 2.4053 7.30804 2.79077 6.7511C3.17625 6.19416 3.67039 5.72016 4.24374 5.35734C4.99567 4.89646 5.86073 4.65102 6.74374 4.648C8.02953 4.64965 9.26219 5.15889 10.1714 6.06404C11.0806 6.96919 11.5921 8.19637 11.5937 9.47644V10.4284H13.5V9.47644C13.4991 8.2025 13.1359 6.95486 12.4523 5.87791C11.7688 4.80097 10.7928 3.93876 9.63749 3.39111C9.67499 3.34756 9.71249 3.29778 9.75624 3.25422C10.1555 2.87689 10.6162 2.56972 11.1187 2.34577C11.6015 2.14729 12.1113 2.02148 12.6312 1.97245C13.5062 1.88219 14.3893 2.03022 15.1863 2.40071C15.9833 2.7712 16.6643 3.35025 17.1565 4.07602C17.6487 4.80178 17.9337 5.64702 17.981 6.52146C18.0282 7.3959 17.8361 8.26671 17.425 9.04089L16.9812 9.88088L18.6625 10.7707L19.1125 9.93066C19.7424 8.7455 20.0015 7.39971 19.8562 6.06667C19.8081 5.58326 19.7032 5.10713 19.5437 4.648C20.4134 4.65564 21.2647 4.89868 22.0062 5.35111C22.5796 5.71393 23.0737 6.18793 23.4592 6.74487C23.8447 7.30181 24.1136 7.9303 24.25 8.59289C24.2639 8.65657 24.2744 8.72096 24.2812 8.78578C24.3051 8.93615 24.3197 9.08784 24.325 9.24C24.325 9.30222 24.325 9.36445 24.325 9.42045C24.325 9.47645 24.325 9.65067 24.325 9.76267C24.3217 9.79785 24.3217 9.83326 24.325 9.86845C24.2417 10.7675 23.9112 11.6264 23.3699 12.3508C22.8285 13.0752 22.0973 13.6372 21.2562 13.9751H21.2125C21.0875 14.0249 20.9625 14.0622 20.8375 14.0995L20.6312 14.1556L20.3875 14.2053L20.1125 14.2489H19.8875H19.6562H19.25H19.025C18.0702 14.1671 17.1611 13.8055 16.4125 13.2098L15.675 12.5876L14.425 14.056L15.1625 14.6782C16.0154 15.3754 17.0256 15.8558 18.1062 16.0782V18.8098C18.1132 18.8864 18.0896 18.9627 18.0404 19.0221C17.9913 19.0815 17.9206 19.1192 17.8437 19.1271Z" />
            </g>
            <defs>
              <clipPath id="clip0_139_8382">
                <rect width="26.25" height="28" fill="white" />
              </clipPath>
            </defs>
          </svg>
          {process.env.NEXT_PUBLIC_ENV === "dev" && (
            <span className="mx-1 text-xs">Dev</span>
          )}
        </button>
        {isTauri && <TauriUpdateExtension />}
        <div
          className={classNames(
            "flex items-center",
            isTauri && "flex-row-reverse"
          )}
        >
          <button
            className="cursor-pointer flex items-center"
            onClick={goCollections}
          >
            <h1 className="ml-4 dark:text-white  sm:block hidden">
              {isTauri ? "Collections" : "Home"}
            </h1>
          </button>
          <button
            onClick={goEditor}
            className={classNames(
              isLatest ? undefined : "indicator tooltip tooltip-bottom"
            )}
            data-tip={isLatest ? undefined : "See what's new!"}
          >
            <h1 className="ml-4 text-sm dark:text-white sm:block hidden">
              {isTauri ? "Home" : "Editor"}
            </h1>

            {!isLatest && (
              <span className="indicator-item h-2 w-2 bg-error rounded-full -right-1 top-1"></span>
            )}
          </button>
          {!isTauri && (
            <Link href="/collections">
              <h1 className="ml-4 text-sm dark:text-white sm:block hidden">
                Collections
              </h1>
            </Link>
          )}
        </div>
      </div>
      <div />
      {process.env.NEXT_PUBLIC_ENV && (
        <ul className="menu menu-horizontal px-1 dark:text-white space-x-2 ">
          <li className="group">
            <Link
              href="https://github.com/RecipeUI/RecipeUI"
              className="btn btn-ghost btn-sm font-sm text-xs"
              target="_blank"
              as=""
            >
              <StarIcon className="w-3 h-3 group-hover:spin group-hover:fill-accent group-hover:text-accent" />
              Star us on Github!
            </Link>
          </li>

          {!user ? (
            <li>
              <button
                id={UNIQUE_ELEMENT_IDS.SIGN_IN}
                className="btn bg-chefYellow text-black btn-sm"
                onClick={() => {
                  setIsLoginModalOpen(true);
                }}
              >
                Log in
              </button>
            </li>
          ) : (
            <>
              <NavMenu user={user} />
            </>
          )}
        </ul>
      )}
      {showForm && (
        <NavAuthForm
          isModalOpen={isLoginModalOpen}
          setIsModalOpen={setIsLoginModalOpen}
        />
      )}
      {onboarding && <OnboardingFlow />}
    </div>
  );
}

function NavMenu({ user }: { user: User }) {
  const supabase = useSupabaseClient();
  const router = useRouter();

  return (
    <div className="dropdown z-40 ">
      <label tabIndex={0} className="btn btn-sm btn-ghost btn-circle">
        <Bars3Icon className="w-6 h-6" />
      </label>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 right-0 font-normal dark:border"
      >
        <li className="pointer-events-none">
          <h3 className="font-bold">{user.username}</h3>
          <p className="text-xs text-gray-600 -mt-1 dark:text-gray-300">
            {user.email}
          </p>
        </li>
        <div className="divider my-0 px-2" />
        <li className="">
          <Link
            href="/"
            className=""
            target="_blank"
            as=""
            onClick={() => {
              // if (isTauri) {
              //   setDesktopPage(null);
              // }
            }}
          >
            Home
          </Link>
        </li>
        {/* <li>
          <button
            onClick={() => {
              router.push(`/u/${user.username}`);
            }}
          >
            Recipes
          </button>
        </li> */}
        <li>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              Cookie.remove(APP_COOKIE);

              location.reload();
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}

import { getVersion } from "@tauri-apps/api/app";
import { useQuery } from "@tanstack/react-query";
import { RecipeMethod } from "types/enums";

import { emit } from "@tauri-apps/api/event";
import { useLatestVersionDetails } from "../../pages/editor/EditorUpdates";
import { hasMajorUpdate } from "utils/constants/updates";
import { isSemverLessThan } from "../../utils/main";

function TauriUpdateExtension() {
  const [version, setVersion] = useState("");

  const nativeFetch = useContext(RecipeNativeFetchContext);

  useEffect(() => {
    getVersion().then((v) => {
      setVersion(v);
    });
  }, []);

  const latestVersion = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [version],
    enabled: !!version,
    // refetchInterval: 5000,
    refetchInterval: 60 * 60 * 1000, // Every hour
    queryFn: async () => {
      if (!nativeFetch) {
        return version;
      }

      try {
        const latestRes = await nativeFetch({
          url: APP_GITHUB_LATEST_RELEASE_URL,
          payload: {
            headers: {},
            method: RecipeMethod.GET,
            body: undefined,
          },
        });
        if (latestRes.status === 200) {
          const latestJson = JSON.parse(latestRes.output);

          return latestJson.version as string;
        }
      } catch (e) {
        console.error(e);
      }

      return version;
    },
  });

  if (
    !version ||
    latestVersion.isLoading ||
    (latestVersion?.data &&
      isSemverLessThan({ oldVer: latestVersion.data, newVer: version }))
  ) {
    return null;
  }

  return (
    <button
      className={classNames(
        "ml-2 btn btn-accent btn-xs -mr-2",
        hasMajorUpdate && "animate-bounce"
      )}
      onClick={() => {
        emit("tauri://update");
      }}
    >
      Update App
    </button>
  );
}
