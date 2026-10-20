import { Resend } from "resend";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, code: string) => {
  const html = await render(
    `<div>Render HTML template for email here</div>`,
  );

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify your SafeSync account",
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
