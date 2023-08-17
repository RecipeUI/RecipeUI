"use client";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { getUrl } from "../../utils/main";

export default function NavAuthForm({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}) {
  const supabase = createClientComponentClient<Database>();
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_in");
  const searchParams = useSearchParams();
  const hasGoogle = searchParams.get("google");

  return (
    <Dialog
      open={isModalOpen}
      onClose={setIsModalOpen}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-base-100 p-8 rounded-lg ">
          <Dialog.Title className="text-2xl font-bold text-chefYellow">
            {view === "sign_in" ? "Sign in" : "Sign up"}
          </Dialog.Title>
          <Dialog.Description className="pb-4">
            Save your recipes and share templates with others!
          </Dialog.Description>
          <Auth
            supabaseClient={supabase}
            view={view}
            showLinks={false}
            appearance={{
              theme: {
                default: {
                  ...ThemeSupa.default,

                  colors: {
                    ...ThemeSupa.default.colors,
                    brand: "#F0A500",
                    brandButtonText: "white",
                    brandAccent: "black",
                    inputText: "#F0A500",
                  },
                  borderWidths: {
                    ...ThemeSupa.default.borderWidths,
                  },
                },
              },
            }}
            providers={hasGoogle ? ["google", "github"] : ["github"]}
            redirectTo={`${getUrl()}/auth/callback`}
          />
          <button
            className="text-sm text-end"
            onClick={() => {
              setView(view === "sign_in" ? "sign_up" : "sign_in");
            }}
          >
            {view === "sign_in"
              ? "Need an account? "
              : "Already have an account? "}
            <span className="underline underline-offset-2">
              {view === "sign_in" ? "Sign up." : "Sign in."}
            </span>
          </button>
          {/* <button onClick={() => setIsModalOpen(false)}>Deactivate</button> */}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
