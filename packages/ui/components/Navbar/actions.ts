import { UserCreationError } from "./types";
import { Database } from "types/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

export type OnboardingFormData = {
  first: string;
  last: string;

  username: string;
  email: string;
  profile_pic?: string;
  company?: string;
  hear_about?: string;
  use_case?: string;
};

export async function createUser(data: OnboardingFormData) {
  const supabase = createClientComponentClient<Database>();

  const userRes = await supabase.auth.getUser();

  const res = await supabase.from("user").insert({
    first: data.first,
    last: data.last,
    username: data.username,
    email: data.email,
    profile_pic: data.profile_pic,
    company: data.company,
    hear_about: data.hear_about,
    use_case: data.use_case,
    user_id: userRes.data.user?.id!,
  });

  return {
    status: res.status,
    error: res.error,
  };
}
