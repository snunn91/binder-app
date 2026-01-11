"use client";

import * as Yup from "yup";

export const SignUpValidationSchema = Yup.object({
  name: Yup.string().required("Please enter your name"),
  email: Yup.string()
    .email("Invalid email")
    .required("Please enter your Email"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .matches(/[0-9]/, "Must include a number")
    .matches(/[^A-Za-z0-9]/, "Must include a special character")
    .required("Please enter a Password"),
});
