"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth/auth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpInitialValues } from "@/lib/initialValues/SignUpInitialValues";
import { SignUpValidationSchema } from "@/lib/validationSchemas/SignUpValidationSchema";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

function getFriendlySignUpError(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes("user already registered") || msg.includes("already registered") || msg.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "Too many attempts. Please try again later.";
  return "Failed to create account. Please try again.";
}

export default function SignUpPage() {
  const shouldReduceMotion = useReducedMotion();
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );

  // const validationSchema = Yup.object({
  //   name: Yup.string().required("Required"),
  //   email: Yup.string().email("Invalid email").required("Required"),
  //   password: Yup.string().min(6, "Minimum 6 characters").required("Required"),
  // });

  const handleSubmit = async (
    values: typeof SignUpInitialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    setError(null);
    setConfirmationEmail(null);
    try {
      await signUp(values.email, values.password);
      setConfirmationEmail(values.email);
    } catch (e) {
      setError(getFriendlySignUpError((e as Error)?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: easeOutExpo },
            }
      }>
      <Card className="w-full max-w-md md:min-w-md rounded-xl px-4 py-8 shadow-xl bg-gray-50 dark:bg-zinc-900/25 backdrop-blur-sm border-zinc-300 dark:border-zinc-500">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.1, ease: easeOutExpo },
                }
          }>
          <CardHeader className="items-center">
            <CardTitle className="text-2xl font-nunito font-bold text-zinc-700 dark:text-slate-100">
              Create account
            </CardTitle>
          </CardHeader>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.18, ease: easeOutExpo },
                }
          }>
          <CardContent className="w-full">
            {confirmationEmail ? (
              <div className="space-y-4 text-center font-nunito">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Account created. Please confirm your email to continue.
                </p>
                <p className="text-sm text-zinc-700 dark:text-slate-100">
                  We sent a confirmation link to{" "}
                  <span className="font-semibold">{confirmationEmail}</span>.
                </p>
                <p className="text-xs text-zinc-600 dark:text-slate-300">
                  After confirming, you will be redirected into your binder
                  dashboard automatically.
                </p>
              </div>
            ) : (
              <Formik
                initialValues={SignUpInitialValues}
                validationSchema={SignUpValidationSchema}
                onSubmit={handleSubmit}>
                {({ isSubmitting, isValid, dirty, values }) => {
                  const hasMinLength = values.password.length >= 6;
                  const hasNumber = /[0-9]/.test(values.password);
                  const hasSpecial = /[^A-Za-z0-9]/.test(values.password);

                  const requirementClass = (met: boolean) =>
                    met ? "text-green-600" : "text-red-400";

                  const RequirementIcon = ({ met }: { met: boolean }) =>
                    met ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <X className="h-4 w-4" aria-hidden="true" />
                    );

                  return (
                    <Form className="flex flex-col gap-4">
                      <div>
                        <Field
                          aria-label="Name"
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Name"
                          className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-nunito font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                        />
                        <ErrorMessage
                          name="name"
                          component="p"
                          className="mt-1 text-md font-nunito font-medium text-red-400"
                        />
                      </div>

                      <div>
                        <Field
                          aria-label="Email"
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-nunito font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                        />
                        <ErrorMessage
                          name="email"
                          component="p"
                          className="mt-1 text-md font-nunito font-medium text-red-400"
                        />
                      </div>

                      <div>
                        <Field
                          aria-label="Password"
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Password"
                          className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-nunito font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                        />
                        <ErrorMessage
                          name="password"
                          component="p"
                          className="mt-1 text-md font-nunito font-medium text-red-400"
                        />
                        <div className="mt-2 space-y-1 text-sm font-nunito">
                          <p
                            className={`flex items-center gap-2 ${requirementClass(
                              hasMinLength,
                            )}`}>
                            <RequirementIcon met={hasMinLength} />
                            Minimum of 6 characters
                          </p>
                          <p
                            className={`flex items-center gap-2 ${requirementClass(
                              hasSpecial,
                            )}`}>
                            <RequirementIcon met={hasSpecial} />
                            Contains a special character
                          </p>
                          <p
                            className={`flex items-center gap-2 ${requirementClass(
                              hasNumber,
                            )}`}>
                            <RequirementIcon met={hasNumber} />
                            Contains a number
                          </p>
                        </div>
                      </div>

                      <div>
                        <Field
                          aria-label="Confirm Password"
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm Password"
                          className="w-full rounded-md border border-zinc-300 bg-slate-100 p-4 text-md font-nunito font-medium text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
                        />
                        <ErrorMessage
                          name="confirmPassword"
                          component="p"
                          className="mt-1 text-md font-nunito font-medium text-red-400"
                        />
                      </div>

                      {error && <p className="text-md font-nunito font-medium text-red-400">{error}</p>}

                      <div className="flex items-center justify-center">
                        <button
                          type="submit"
                          className="relative flex items-center overflow-hidden rounded-full border border-zinc-700 bg-slate-200 px-6 py-3 text-md font-nunito font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-slate-100 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700"
                          disabled={isSubmitting || !isValid || !dirty}>
                          <span className="relative z-10">
                            {isSubmitting ? "Creating..." : "Create account"}
                          </span>
                        </button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </CardContent>
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.26, ease: easeOutExpo },
                }
          }>
          <CardFooter className="flex w-full flex-col items-center gap-3">
            <p className="text-sm font-nunito font-medium text-zinc-700 dark:text-slate-100">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-bold text-sky-700 underline underline-offset-2">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </motion.div>
      </Card>
    </motion.div>
  );
}
