import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  programName?: string
  status?: string
  reviewerNote?: string
}

const Email = ({ programName = 'your benefit program', status = 'Submitted', reviewerNote }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your ${programName} application was ${status.toLowerCase()}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Claimly</Text>
        <Heading style={heading}>Update on your application</Heading>
        <Text style={text}>
          Your <strong>{programName}</strong> application has been processed by our review team.
        </Text>
        <Section style={statusBox}>
          <Text style={statusLabel}>Status</Text>
          <Text style={statusValue}>{status}</Text>
        </Section>
        {reviewerNote ? <Text style={note}>{reviewerNote}</Text> : null}
        <Text style={text}>
          You can view the full application and download a copy any time from your Claimly account.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          You are receiving this because a claim tied to this email address was reviewed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Your ${data.programName ?? 'Claimly'} application was ${String(data.status ?? 'updated').toLowerCase()}`,
  displayName: 'Application confirmation',
  previewData: {
    programName: 'SNAP (Food Assistance)',
    status: 'Approved',
    reviewerNote: 'Your submission was received and approved by Claimly.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#16200f' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#4d6b2a', margin: '0 0 8px' }
const heading = { fontSize: '24px', lineHeight: '1.25', margin: '0 0 16px', color: '#16200f' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#31402a', margin: '0 0 14px' }
const statusBox = { backgroundColor: '#f2f6ec', borderRadius: '14px', padding: '16px 18px', margin: '0 0 16px' }
const statusLabel = { fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#6b7a5e', margin: '0 0 4px' }
const statusValue = { fontSize: '18px', fontWeight: 600, color: '#33501c', margin: '0' }
const note = { fontSize: '14px', lineHeight: '1.6', color: '#31402a', backgroundColor: '#faf9f4', borderRadius: '12px', padding: '14px 16px', margin: '0 0 16px' }
const hr = { borderColor: '#e6e6e0', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#8a8a80', margin: '0' }
