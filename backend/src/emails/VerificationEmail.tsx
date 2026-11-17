import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

interface VerificationEmailProps {
  code: string;
  purpose?: "account" | "email-change";
}

export const VerificationEmail = ({
  code,
  purpose = "account",
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Container
          style={{
            padding: "24px",
            backgroundColor: "#ffffff",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <Heading>{purpose === "email-change" ? "Confirm your new SafeSync email" : "Welcome to SafeSync!"}</Heading>

          <Text>
            {purpose === "email-change"
              ? "Use this code to confirm the new email address on your SafeSync account."
              : "Use the verification code below to verify your email address."}
          </Text>

          <Heading style={{ letterSpacing: "8px" }}>{code}</Heading>

          <Text>This code expires in 10 minutes.</Text>

          <Hr />

          <Text>
            If you didn't request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
