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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://skhdbdmyrrpvgxkhytfm.supabase.co/storage/v1/object/public/email-assets/honest-invoice-logo.png"
          alt="HonestInvoice"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Click the button below to accept the invitation and set up your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          Weren't expecting this? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
  margin: '0 0 24px',
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
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 56%)', margin: '32px 0 0' }
