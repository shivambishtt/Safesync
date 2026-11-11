import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Reset Your Password</Heading>

          <Text>
            We received a request to reset your SafeSync account password.
          </Text>

          <Text>Click the button below to create a new password.</Text>

          <Button href={resetUrl}>Reset Password</Button>

          <Text>This link will expire in 15 minutes.</Text>

          <Text>
            If you didn't request a password reset, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
