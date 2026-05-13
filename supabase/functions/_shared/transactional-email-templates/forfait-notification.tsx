import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harelbeekse Minivoetbal'

interface ForfaitNotificationProps {
  homeTeamName?: string
  awayTeamName?: string
  forfaitTeamName?: string
  matchDate?: string
  matchTime?: string
  location?: string
}

const ForfaitNotificationEmail = ({
  homeTeamName = '',
  awayTeamName = '',
  forfaitTeamName = '',
  matchDate,
  matchTime,
  location,
}: ForfaitNotificationProps) => {
  const matchLine = `${homeTeamName} - ${awayTeamName}`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Forfait: {matchLine}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Forfait</Heading>
          <Text style={text}>Beste,</Text>
          <Text style={text}>
            Hierbij melden wij dat de onderstaande wedstrijd <strong>niet zal doorgaan</strong>.
            Het team <strong>{forfaitTeamName}</strong> heeft forfait gegeven.
          </Text>
          <Section style={card}>
            <Text style={cardLine}><strong>Wedstrijd:</strong> {matchLine}</Text>
            {matchDate && (
              <Text style={cardLine}>
                <strong>Datum:</strong> {matchDate}{matchTime ? ` om ${matchTime}` : ''}
              </Text>
            )}
            {location && (
              <Text style={cardLine}><strong>Locatie:</strong> {location}</Text>
            )}
          </Section>
          <Text style={text}>Gelieve hier rekening mee te houden in jullie planning.</Text>
          <Text style={footer}>Met vriendelijke groet,<br />{SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ForfaitNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Forfait: ${data?.homeTeamName ?? ''} - ${data?.awayTeamName ?? ''}`,
  displayName: 'Forfait melding',
  previewData: {
    homeTeamName: 'Shaktar Belledune',
    awayTeamName: 'Truuk City',
    forfaitTeamName: 'Truuk City',
    matchDate: 'dinsdag 19 mei 2026',
    matchTime: '18:30',
    location: 'Bavikhove - Vlasschaard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#7c3aed', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#111827', lineHeight: '1.5', margin: '0 0 16px' }
const card = {
  backgroundColor: '#faf5ff',
  border: '1px solid #e9d5ff',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const cardLine = { fontSize: '14px', color: '#111827', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#6b7280', margin: '24px 0 0' }
