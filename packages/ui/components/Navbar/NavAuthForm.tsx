"use client";
import { Dialog } from "@headlessui/react";

import { Provider } from "./HybridAuthForm/providers";
import dynamic from "next/dynamic";
import { Loading } from "../Loading";
const HybridAuthForm = dynamic(() => import("./HybridAuthForm"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function NavAuthForm({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}) {
  return (
    <Dialog
      open={isModalOpen}
      onClose={setIsModalOpen}
      className="relative z-50"
      autoFocus={false}
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-base-100 p-8 rounded-lg ">
          <Dialog.Title className="text-2xl font-bold text-chefYellow">
            RecipeUI
          </Dialog.Title>
          <Dialog.Description className="pb-4">
            Save your recipes and share templates with others!
          </Dialog.Description>
          <HybridAuthForm providers={[Provider.Github, Provider.Google]} />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
