/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://skhdbdmyrrpvgxkhytfm.supabase.co/storage/v1/object/public/email-assets/honest-invoice-logo.png"
          alt="HonestInvoice"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>Honest Invoice</strong>
          </Link>
          ! You're almost ready to start invoicing clients.
        </Text>
        <Text style={text}>
          Confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email Address
        </Button>
        <Text style={appText}>
          Want invoicing in your pocket? Get the app and create invoices on the go — even offline.
        </Text>
        <Button style={appButton} href="https://play.google.com/store/apps/details?id=com.honestinvoice.app">
          📲 Get the App
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', 'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '520px', margin: '0 auto', padding: '40px 32px' }
const logo = { display: 'block', margin: '0 0 28px 0', borderRadius: '12px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: 'hsl(220, 25%, 10%)',
  margin: '0 0 16px',
  fontFamily: "'Space Grotesk', 'Segoe UI', Arial, sans-serif",
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 36%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: 'hsl(142, 72%, 35%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(142, 72%, 42%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const appText = { fontSize: '13px', color: 'hsl(220, 10%, 50%)', margin: '28px 0 8px', fontStyle: 'italic' as const }
const appButton = {
  backgroundColor: 'hsl(220, 25%, 15%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '11px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  border: '1px solid hsl(142, 72%, 35%)',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 56%)', margin: '32px 0 0' }
