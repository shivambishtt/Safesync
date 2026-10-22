import crypto from "crypto";

export const generateCode = (code: string | null): string | undefined => {
  if (!code) return;

  const verificationCode = crypto
    .randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");

  return verificationCode;
};
