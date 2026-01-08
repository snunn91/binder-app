"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string()
        .min(6, "Minimum 6 characters")
        .required("Required"),
    }),
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
    <div className="flex w-full max-w-md flex-col items-center space-y-8 rounded-xl bg-zinc-700/10 px-4 py-8 shadow-xl backdrop-blur-sm">
      <h2 className="text-2xl font-exo font-bold text-zinc-700 dark:text-slate-100">
        Sign In
      </h2>

      <form
        onSubmit={formik.handleSubmit}
        className="flex w-full flex-col items-center space-y-4">
        <div className="w-full">
          <input
            aria-label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            className="w-full rounded-md border border-zinc-700 bg-zinc-700 p-4 text-md font-exo font-medium text-slate-100 shadow-sm placeholder:text-slate-200 focus:border-slate-300 focus:outline-none dark:bg-slate-100 dark:text-zinc-700 dark:placeholder:text-zinc-500"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-md font-exo font-medium text-red-800">
              {formik.errors.email}
            </p>
          )}
        </div>

        <div className="w-full">
          <input
            aria-label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            className="w-full rounded-md border border-zinc-700 bg-zinc-700 p-4 text-md font-exo font-medium text-slate-100 shadow-sm placeholder:text-slate-200 focus:border-slate-300 focus:outline-none dark:bg-slate-100 dark:text-zinc-700 dark:placeholder:text-zinc-500"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-md font-exo font-medium text-red-800">
              {formik.errors.password}
            </p>
          )}
        </div>

        {error && (
          <p className="w-full text-md font-exo font-medium text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="relative flex items-center overflow-hidden rounded-full border border-zinc-700 bg-slate-100 px-6 py-3 text-md font-exo font-medium text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-100 dark:bg-zinc-700 dark:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700"
          disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}>
          <span className="relative z-10">
            {formik.isSubmitting ? "Signing in..." : "Sign in with Email"}
          </span>
        </button>
      </form>

      <div className="flex w-full flex-col items-center gap-3">
        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-700 bg-white px-4 py-3 text-md font-exo font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          disabled={googleLoading}>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21.805 10.023h-9.744v3.955h5.58c-.24 1.44-1.704 4.223-5.58 4.223-3.356 0-6.086-2.756-6.086-6.152 0-3.397 2.73-6.153 6.086-6.153 1.91 0 3.184.813 3.91 1.515l2.66-2.555C17.86 3.17 15.56 2.1 12.06 2.1 6.887 2.1 2.61 6.42 2.61 11.593c0 5.174 4.277 9.495 9.45 9.495 5.444 0 9.043-3.83 9.043-9.223 0-.62-.07-1.09-.308-1.34z"
              fill="#4285F4"
            />
          </svg>
          <span>
            {googleLoading
              ? "Signing in with Google..."
              : "Sign in with Google"}
          </span>
        </button>

        <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Don&#39;t have an account?{" "}
          <Link
            href="/signin/signup"
            className="font-bold text-sky-900 underline underline-offset-2">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
