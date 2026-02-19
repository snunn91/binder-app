import { supabase } from "@/lib/supabase/client";

export function signUp(email: string, password: string) {
  void email;
  void password;
  throw new Error(
    "Email/password sign-up is temporarily disabled during migration. Use Google sign-in."
  );
}

export function signIn(email: string, password: string) {
  void email;
  void password;
  throw new Error(
    "Email/password sign-in is temporarily disabled during migration. Use Google sign-in."
  );
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle() {
  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/signin`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw new Error(error.message);
}
