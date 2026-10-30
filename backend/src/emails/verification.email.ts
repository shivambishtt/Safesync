import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "../emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  code: string,
  verificationCodeExpiry: Date,
) => {
  const html = await render(
    VerificationEmail({ code, verificationCodeExpiry }),
  );

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
