"use client";

import * as Yup from "yup";

export const AddBinderValidationSchema = Yup.object({
  name: Yup.string().required("Please enter a name"),
  layout: Yup.string().required("Please select a binder size"),
  theme: Yup.string().required("Please select a theme"),
});
