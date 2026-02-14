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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AddBinderModal() {
  const user = useAppSelector((state) => state.auth.user);
  const creating = useAppSelector((state) => state.binders.creating);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (
    values: typeof AddBinderInitialValues,
    { resetForm }: { resetForm: () => void }
  ) => {
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
          disabled={!user}
          className="relative flex items-center gap-2 overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-6 py-3 text-md font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create a Binder
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Binder</DialogTitle>
          <DialogDescription>
            Name your binder and choose its layout and color scheme.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={AddBinderInitialValues}
          validationSchema={AddBinderValidationSchema}
          onSubmit={handleSubmit}>
          {({ isValid, dirty }) => (
            <Form className="mt-6 space-y-4 text-left">
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
                  className="w-full rounded-md border border-zinc-300 bg-slate-100 p-3 text-sm font-exo text-zinc-700 shadow-sm placeholder:text-zinc-700 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100 dark:placeholder:text-slate-100"
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
                  className="w-full rounded-md border border-zinc-300 bg-slate-100 p-3 text-sm font-exo text-zinc-700 shadow-sm focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100">
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
                  className="w-full rounded-md border border-zinc-300 bg-slate-100 p-3 text-sm font-exo text-zinc-700 shadow-sm focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 active:border-accent active:ring-2 active:ring-accent/40 dark:border-zinc-500 dark:bg-zinc-800 dark:text-slate-100">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creating || !dirty || !isValid}
                  className="relative flex items-center overflow-hidden rounded-full border border-zinc-300 bg-slate-200 px-6 py-2 text-sm font-exo font-medium text-zinc-700 disabled:text-zinc-700 before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-zinc-700 before:transition-all before:duration-500 hover:text-slate-100 hover:before:w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:before:w-0 disabled:before:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent dark:border-zinc-500 dark:bg-zinc-700 dark:text-slate-100 dark:disabled:text-slate-100 dark:before:bg-slate-100 dark:hover:text-zinc-700">
                  <span className="relative z-10">
                    {creating ? "Creating..." : "Create Binder"}
                  </span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
