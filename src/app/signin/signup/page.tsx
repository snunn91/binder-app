"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/firebase/auth";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function SignUpPage() {
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
        await signUp(values.email, values.password);
        router.push("/");
      } catch (e) {
        setError((e as Error)?.message ?? "Failed to sign up");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create account
      </h2>
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <div>
          <input
            aria-label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            className="w-full rounded-md border px-3 py-2"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <input
            aria-label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            className="w-full rounded-md border px-3 py-2"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {formik.errors.password}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-60"
            disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Creating..." : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
