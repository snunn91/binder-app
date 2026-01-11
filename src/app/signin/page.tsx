"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth";
import { ErrorMessage, Field, FormikProvider, useFormik } from "formik";
import { SignInValidationSchema } from "@/lib/validationSchemas/SignInValidationSchema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: SignInValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await signIn(values.email, values.password);
        router.push("/");
      } catch (e) {
        setError((e as Error)?.message ?? "Failed to sign in");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (e) {
      setError((e as Error)?.message ?? "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full min-w-md rounded-xl px-4 py-8 shadow-xl bg-gray-50 dark:bg-zinc-900/25 backdrop-blur-sm border-zinc-300 dark:border-zinc-500">
      <CardHeader className="items-center">
        <CardTitle className="text-2xl font-exo font-bold text-zinc-700 dark:text-slate-100">
          Sign In
        </CardTitle>
      </CardHeader>

      <CardContent className="w-full">
        <FormikProvider value={formik}>
          <form
            onSubmit={formik.handleSubmit}
            className="flex w-full flex-col items-center space-y-4">
            <div className="w-full">
              <Field
                aria-label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-exo font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:border-zinc-300 focus:outline-none dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
              />
              <ErrorMessage
                name="email"
                component="p"
                className="mt-1 text-md font-exo font-medium text-red-600"
              />
            </div>

            <div className="w-full">
              <Field
                aria-label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-exo font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:border-zinc-300 focus:outline-none dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
              />
              <ErrorMessage
                name="password"
                component="p"
                className="mt-1 text-md font-exo font-medium text-red-600"
              />
            </div>

            {error && (
              <p className="w-full text-md font-exo font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="flex w-full justify-center">
              <button
                type="submit"
                className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-100 px-6 py-3 text-md font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700"
                disabled={
                  !formik.isValid || !formik.dirty || formik.isSubmitting
                }>
                <span className="relative z-10">
                  {formik.isSubmitting ? "Signing in..." : "Sign in with Email"}
                </span>
              </button>
            </div>
          </form>
        </FormikProvider>
      </CardContent>

      <CardFooter className="flex w-full flex-col items-center gap-3">
        <button
          className="flex items-center justify-center me-2 px-6 py-3 text-md text-slate-100 font-normal font-exo bg-zinc-700 dark:bg-slate-100 dark:text-zinc-700 rounded-full shadow-md transition hover:scale-105 active:scale-105 focus:scale-105"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}>
          <FcGoogle className="w-6 h-6 mr-2" />
          <span>Sign in with Google</span>
        </button>

        <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Don&#39;t have an account?{" "}
          <Link
            href="/signin/signup"
            className="font-bold text-sky-700 underline underline-offset-2">
            Create one here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
