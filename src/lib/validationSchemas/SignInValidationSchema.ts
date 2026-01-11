import * as Yup from "yup";

export const SignInValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Your Email is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .required("Your Password is required"),
});
