"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { getUrl } from "../../utils/main";
import { emit, listen } from "@tauri-apps/api/event";
import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { relaunch } from "@tauri-apps/api/process";

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

  const router = useRouter();

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
          <button
            className="btn btn-sm"
            onClick={async () => {
              console.log("clicking link");

              listen("oauth://url", (data) => {
                console.log("data", data);

                if (!data.payload) return;

                const url = new URL(data.payload as string);
                const code = new URLSearchParams(url.search).get("code");

                console.log({ code });

                if (code) {
                  supabase.auth
                    .exchangeCodeForSession(code)
                    .then(({ data, error }) => {
                      console.log({ data, error });
                      if (error) {
                        console.log(error);
                        return;
                      }
                      relaunch();
                    });
                }
              });

              // googleSignIn(data.payload as string);

              // Start tauri oauth plugin. When receive first request
              // When it starts, will return the server port
              // it will kill the server
              invoke("plugin:oauth|start", {
                // config: {
                //   // Optional config, but use here to more friendly callback page
                //   response: callbackTemplate,
                // },
              }).then(async (port) => {
                const { data, error, ...props } =
                  await supabase.auth.signInWithOAuth({
                    options: {
                      skipBrowserRedirect: true,
                      redirectTo: `http://localhost:${port}`,
                    },
                    provider: "github",
                  });

                if (data.url) {
                  console.log("Opening url", data.url);
                  shell.open(data.url);
                }
              });

              // console.log({ data, error, props });
              // console.log(data.url);
              // // const { url } = data;

              // console.log("here", { data, error });
            }}
          >
            Github
          </button>
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
            providers={hasGoogle ? ["google", "github"] : ["google", "github"]}
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
