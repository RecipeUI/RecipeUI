"use server";

import { UserCreationError } from "@/components/Navbar/types";
import { Database } from "@/types/database.types";
import {
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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
  const supabase = createServerActionClient<Database>({ cookies: cookies });

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

  if (res.status === 409) {
    redirect(
      `/?${new URLSearchParams({
        [UserCreationError.UserAlreadyExists]: data.username,
      }).toString()}`
    );
  } else if (res.error != null) {
    redirect(
      `/?${new URLSearchParams({
        userError: UserCreationError.General,
      }).toString()}`
    );
  }

  redirect("/");
  return;
}
