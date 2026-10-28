import crypto from "crypto";

export const generateCode = (): string => {
  const verificationCode = crypto
    .randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");

  return verificationCode;
};
