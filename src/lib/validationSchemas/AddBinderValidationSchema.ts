"use client";

import * as Yup from "yup";

export const AddBinderValidationSchema = Yup.object({
  name: Yup.string().required("Please enter a name").max(50, "Name must be 50 characters or fewer"),
  layout: Yup.string().required("Please select a binder size"),
  colorScheme: Yup.string().required("Please select a color scheme"),
});
