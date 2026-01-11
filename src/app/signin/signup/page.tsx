"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/firebase/auth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const initialValues = { name: "", email: "", password: "" };

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Minimum 6 characters").required("Required"),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setError(null);
    try {
      await signUp(values.email, values.password);
      router.push("/");
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full min-w-md rounded-xl px-4 py-8 shadow-xl bg-gray-50 dark:bg-zinc-900/25 backdrop-blur-sm border-zinc-300 dark:border-zinc-500">
      <CardHeader className="items-center">
        <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create account
        </CardTitle>
      </CardHeader>

      <CardContent className="w-full">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}>
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <Field
                  aria-label="Name"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Name"
                  className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-exo font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:border-zinc-300 focus:outline-none dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                />
                <ErrorMessage
                  name="name"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <div>
                <Field
                  aria-label="Email"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-exo font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:border-zinc-300 focus:outline-none dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <div>
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
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-100 px-6 py-3 text-md font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700"
                  disabled={isSubmitting || !isValid || !dirty}>
                  <span className="relative z-10">
                    {isSubmitting ? "Creating..." : "Create account"}
                  </span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </CardContent>
      <CardFooter className="flex w-full flex-col items-center gap-3">
        <p className="text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-bold text-sky-700 underline underline-offset-2">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
