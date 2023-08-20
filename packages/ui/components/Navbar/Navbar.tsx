"use client";
import { useRouter } from "next/navigation";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { useIsMobile } from "../../hooks";
import { useEffect, useState } from "react";
import classNames from "classnames";

import { Bars3Icon, StarIcon } from "@heroicons/react/24/outline";
import { User } from "types/database";
import Link from "next/link";
import { APP_COOKIE, UNIQUE_ELEMENT_IDS } from "../../utils/constants/main";
import { OnboardingFlow } from "./OnboardingFlow";
import NavAuthForm from "./NavAuthForm";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "types/enums";
import { isTauri } from "../../utils/main";

import Cookie from "js-cookie";

export function Navbar() {
  const router = useRouter();

  const userSession = useRecipeSessionStore((state) => state.userSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (userSession) {
      setShowForm(false);
    }
  }, [userSession]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);

  const onboarding = useRecipeSessionStore((state) => state.onboarding);
  const isMobile = useIsMobile();

  const queryClient = useQueryClient();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  return (
    <div className="py-2 sm:py-0 w-full flex justify-between min-h-12 items-center font-bold shadow-sm px-4 text-black sticky top-0 z-20 bg-white dark:bg-base-100 border-b border-slate-200 dark:border-slate-600">
      <div />
      <ul className="menu menu-horizontal px-1 dark:text-white space-x-2">
        <li className="">
          <Link
            href="https://github.com/RecipeUI/RecipeUI"
            className="btn btn-ghost btn-sm font-sm text-xs"
            target="_blank"
            as=""
          >
            <StarIcon className="w-3 h-3" />
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
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  return (
    <div className="dropdown ">
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

        <li>
          <button
            onClick={() => {
              router.push(`/u/${user.username}`);
            }}
          >
            Recipes
          </button>
        </li>
        <li>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              Cookie.remove(APP_COOKIE);

              window.location.reload();
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
