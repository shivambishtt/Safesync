import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "./VerificationEmail";
import {PasswordResetEmail} from "./PasswordResetEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, code: string) => {
  const html = await render(VerificationEmail({ code }));

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_EMAIL_FROM!,
    to: email,
    subject: "Verify your SafeSync account",
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
) => {
  const html = await render(PasswordResetEmail({ resetUrl }));

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_EMAIL_FROM!,
    to: email,
    subject: "Reset your password here",
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
