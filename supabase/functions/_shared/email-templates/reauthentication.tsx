/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://skhdbdmyrrpvgxkhytfm.supabase.co/storage/v1/object/public/email-assets/honest-invoice-logo.png"
          alt="HonestInvoice"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  margin: '0 0 16px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(142, 72%, 35%)',
  letterSpacing: '6px',
  margin: '8px 0 32px',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 56%)', margin: '32px 0 0' }
