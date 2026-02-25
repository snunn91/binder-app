"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Plus } from "lucide-react";
import { createBinder } from "@/lib/store/slices/bindersSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/storeHooks";
import { AddBinderInitialValues } from "@/lib/initialValues/AddBinderInitialValues";
import { AddBinderValidationSchema } from "@/lib/validationSchemas/AddBinderValidationSchema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BINDER_LIMIT_REACHED_MESSAGE,
  MAX_BINDERS,
} from "@/config/binderLimits";

export default function AddBinderModal() {
  const user = useAppSelector((state) => state.auth.user);
  const creating = useAppSelector((state) => state.binders.creating);
  const binders = useAppSelector((state) => state.binders.items);
  const createError = useAppSelector((state) => state.binders.error);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const isBinderLimitReached = binders.length >= MAX_BINDERS;
  const disableCreate = !user || isBinderLimitReached;

  const handleSubmit = async (
    values: typeof AddBinderInitialValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    if (isBinderLimitReached) return;

    try {
      await dispatch(createBinder(values)).unwrap();
      resetForm();
      setOpen(false);
    } catch {
      // Errors are handled in Redux state if needed later.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disableCreate}
          className="relative flex items-center gap-2 overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-6 py-3 text-md font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create a Binder
          </span>
        </button>
      </DialogTrigger>
      {isBinderLimitReached ? (
        <p className="mt-2 text-sm font-exo font-medium text-red-600">
          {BINDER_LIMIT_REACHED_MESSAGE}
        </p>
      ) : null}
      <DialogContent className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-0 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <DialogTitle className="text-left">Create a Binder</DialogTitle>
            <DialogDescription className="text-left">
              {isBinderLimitReached
                ? `You can have up to ${MAX_BINDERS} binders.`
                : "Name your binder and choose its layout and color scheme."}
            </DialogDescription>
          </DialogHeader>

          <Formik
            initialValues={AddBinderInitialValues}
            validationSchema={AddBinderValidationSchema}
            onSubmit={handleSubmit}>
            {({ isValid, dirty }) => (
              <Form className="space-y-4 p-4 text-left">
                <div>
                  <label
                    htmlFor="binder-name"
                    className="mb-2 block text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                    Name
                  </label>
                  <Field
                    id="binder-name"
                    name="name"
                    type="text"
                    placeholder="My Binder"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-400"
                  />
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="binder-layout"
                    className="mb-2 block text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                    Binder size
                  </label>
                  <Field
                    as="select"
                    id="binder-layout"
                    name="layout"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100">
                    <option value="2x2">2x2</option>
                    <option value="3x3">3x3</option>
                    <option value="4x4">4x4</option>
                  </Field>
                  <ErrorMessage
                    name="layout"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="binder-color-scheme"
                    className="mb-2 block text-sm font-exo font-medium text-zinc-700 dark:text-slate-100">
                    Color scheme
                  </label>
                  <Field
                    as="select"
                    id="binder-color-scheme"
                    name="colorScheme"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-exo text-zinc-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100">
                    <option value="default">Default (No color)</option>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                  </Field>
                  <ErrorMessage
                    name="colorScheme"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {createError ? (
                  <p className="text-sm font-exo font-medium text-red-600">{createError}</p>
                ) : null}

                <DialogFooter className="border-t border-zinc-200 px-0 pt-4 sm:justify-end dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-zinc-300 bg-slate-200 px-4 py-2 text-sm font-exo font-medium text-zinc-700 transition hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:hover:bg-zinc-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !dirty || !isValid || isBinderLimitReached}
                    className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-exo font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent">
                    {creating ? "Creating..." : "Create Binder"}
                  </button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </DialogContent>
    </Dialog>
  );
}
