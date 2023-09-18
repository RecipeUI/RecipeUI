"use client";
import { RecipeOutputType } from "types/database";
import { SessionOutput } from "../recipeSession";
import { useCallback, useEffect, useState } from "react";
import { eventEmitter, getOnboardingStore } from ".";
import { OnboardingKey } from "utils/constants";

export class OnboardingAPI {
  static getOnboardingInfo = async (onboarding: OnboardingKey) => {
    const store = await getOnboardingStore();

    const needsOnboarding = await store.get(onboarding);
    return needsOnboarding === undefined ? true : needsOnboarding;
  };
}

export function useNeedsOnboarding(onboarding: OnboardingKey) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function refreshOnboardingTutorials() {
      OnboardingAPI.getOnboardingInfo(onboarding).then((info) => {
        setNeedsOnboarding(info);
      });
    }

    eventEmitter.on("refreshOnboarding", refreshOnboardingTutorials);

    refreshOnboardingTutorials();
    return () => {
      eventEmitter.off("refreshOnboarding", refreshOnboardingTutorials);
    };
  }, [onboarding]);

  const turnOffOnboarding = useCallback(async () => {
    const store = await getOnboardingStore();
    await store.put(false, onboarding);

    eventEmitter.emit("refreshOnboarding");
  }, [onboarding]);

  return {
    needsOnboarding,
    turnOffOnboarding,
  };
}
