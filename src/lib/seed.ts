import type { Broker, EngagementEntry, Snippet, Webinar, EngagementType, EngagementStatus } from './types'
import { uid } from './utils'

const today = new Date()
function daysAgo(n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function daysAhead(n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const seedBrokers: Broker[] = [
  { id: uid('b_'), name: 'John Hartman',     brokerage: 'Hartman & Co Realty',     email: 'john@hartmanco.com',     phone: '(602) 555-0101', agent_count: 47,  stage: 'won',    tags: ['phoenix','luxury'],   notes: 'Onboarded Q1. Quarterly check-in cadence.', next_action: 'Q2 market beat email', next_action_date: daysAhead(3),  created_at: daysAgo(120) },
  { id: uid('b_'), name: 'Marisol Vega',     brokerage: 'Coastline Properties',    email: 'mvega@coastlineproperties.com', phone: '(310) 555-0144', agent_count: 22,  stage: 'hot',    tags: ['california','coastal'], notes: 'Decision pending — wants demo with broker partner Friday.', next_action: 'Send demo recap + pricing', next_action_date: daysAhead(1), created_at: daysAgo(45) },
  { id: uid('b_'), name: 'Devon Pritchett',  brokerage: 'Anchor Bay Realty',       email: 'devon@anchorbayrealty.com', phone: '(617) 555-0192', agent_count: 31,  stage: 'hot',    tags: ['boston'],             notes: 'Concerned about MLS data fees. Sent fraud prevention case study.', next_action: 'Reply to objections', next_action_date: daysAhead(0), created_at: daysAgo(38) },
  { id: uid('b_'), name: 'Yara Solano',      brokerage: 'Solano Real Estate Group',email: 'yara@solanoreg.com',     phone: '(786) 555-0177', agent_count: 14,  stage: 'active', tags: ['miami','spanish'],    notes: 'Bilingual office. Wants spanish-language collateral.', next_action: 'Webinar invite — May edition', next_action_date: daysAhead(2), created_at: daysAgo(60) },
  { id: uid('b_'), name: 'Tomasz Krol',      brokerage: 'Krol & Sons Realty',      email: 'tomek@krolandsons.com',  phone: '(312) 555-0166', agent_count: 88,  stage: 'active', tags: ['chicago','large'],    notes: 'Big brokerage. Compliance team needs SOC2.', next_action: 'Forward SOC2 attestation', next_action_date: daysAhead(5), created_at: daysAgo(72) },
  { id: uid('b_'), name: 'Priya Raman',      brokerage: 'Raman Group',             email: 'priya@ramangroup.co',    phone: '(408) 555-0188', agent_count: 19,  stage: 'active', tags: ['bay-area','tech'],    notes: 'Tech-forward office. Wants API docs.', next_action: 'Connect to dev portal', next_action_date: daysAhead(7), created_at: daysAgo(50) },
  { id: uid('b_'), name: 'Adaeze Okafor',    brokerage: 'Okafor Realty Partners',  email: 'adaeze@okaforrp.com',    phone: '(404) 555-0133', agent_count: 26,  stage: 'warm',   tags: ['atlanta'],            notes: 'Replied to welcome. Interested but slow.', next_action: 'Soft follow-up', next_action_date: daysAhead(10), created_at: daysAgo(28) },
  { id: uid('b_'), name: 'Henrik Lindqvist', brokerage: 'Northstar Brokerage',     email: 'henrik@northstarbrokerage.com', phone: '(612) 555-0155', agent_count: 12,  stage: 'warm', tags: ['minneapolis'],      notes: 'Small office. Webinar attendee Mar 14.', next_action: 'Send case study', next_action_date: daysAhead(8), created_at: daysAgo(35) },
  { id: uid('b_'), name: 'Camille Bouchard', brokerage: 'Bouchard Realty Network', email: 'camille@bouchardrn.com', phone: '(514) 555-0122', agent_count: 41,  stage: 'warm',   tags: ['quebec','french'],    notes: 'French-speaking office.', next_action: 'French collateral request', next_action_date: daysAhead(14), created_at: daysAgo(40) },
  { id: uid('b_'), name: 'Reggie Tate',      brokerage: 'Tate Brothers Realty',    email: 'reggie@tatebrothers.com', phone: '(214) 555-0188', agent_count: 18, stage: 'cold',   tags: ['dallas'],             notes: 'No reply to last 3 emails.', next_action: 'Re-engagement try', next_action_date: daysAhead(2), created_at: daysAgo(95) },
  { id: uid('b_'), name: 'Saoirse Brennan',  brokerage: 'Brennan & Associates',    email: 'saoirse@brennanassoc.com', phone: '(617) 555-0144', agent_count: 9, stage: 'cold',   tags: ['boston','small'],     notes: 'Cold since Feb intro.', next_action: 'Re-engagement try', next_action_date: daysAhead(5), created_at: daysAgo(110) },
  { id: uid('b_'), name: 'Ines Marchetti',   brokerage: 'Marchetti Realty',        email: 'ines@marchettirealty.com', phone: '(305) 555-0188', agent_count: 23, stage: 'cold', tags: ['miami','italian'],   notes: 'Initial pitch ignored. Try referral angle.', next_action: 'Referral re-intro', next_action_date: daysAhead(7), created_at: daysAgo(140) },
]

const ENGAGEMENT_PATTERNS: Array<{type: EngagementType, ask: string}> = [
  { type: 'welcome',           ask: 'intro_call' },
  { type: 'follow_up',         ask: 'demo_schedule' },
  { type: 'webinar_invite',    ask: 'webinar_register' },
  { type: 'webinar_reminder',  ask: 'webinar_attend' },
  { type: 'agent_blast',       ask: 'forward_to_agents' },
  { type: 'content_drop',      ask: 'review_market_beat' },
  { type: 're_engagement',     ask: 'reconnect' },
  { type: 'follow_up',         ask: 'pricing_discussion' },
  { type: 'monthly_review',    ask: 'qbr_schedule' },
]

const STATUSES: EngagementStatus[] = ['sent','sent','sent','replied','replied','no_response','no_response','sent','replied']

export const seedLog: EngagementEntry[] = (() => {
  const entries: EngagementEntry[] = []
  seedBrokers.forEach((b, idx) => {
    const interactions = b.stage === 'cold' ? 2 : b.stage === 'warm' ? 4 : b.stage === 'active' ? 6 : b.stage === 'hot' ? 8 : 10
    for (let i = 0; i < interactions; i++) {
      const pattern = ENGAGEMENT_PATTERNS[(i + idx) % ENGAGEMENT_PATTERNS.length]
      const status = STATUSES[(i + idx * 2) % STATUSES.length]
      const dayOffset = b.stage === 'cold' ? 60 + i * 10 : b.stage === 'won' ? 90 - i * 7 : (b.stage === 'hot' ? 1 : 4) + (interactions - i) * 5
      entries.push({
        id: uid('e_'),
        date: daysAgo(dayOffset),
        broker_name: b.name,
        brokerage: b.brokerage,
        type: pattern.type,
        ask: pattern.ask,
        status,
        notes: status === 'replied' ? 'positive — ' + pattern.ask.replace('_', ' ') : '',
      })
    }
  })
  return entries.sort((a, b) => a.date.localeCompare(b.date))
})()

export const seedSnippets: Snippet[] = [
  { id: uid('s_'), title: 'Q2 Market Beat (general)',     category: 'market_beat',      starred: true,  use_count: 12, created_at: daysAgo(30), body: 'Hi {{first_name}},\n\nQuick Q2 market read — inventory is down 8% YoY in your zip while median list price is up 3.2%. Three trends worth flagging to your agents this week:\n\n1. Days-on-market compressed to 22 (from 31 in Q1)\n2. Cash buyer share up to 28% — repeat buyers returning\n3. Listing fraud incidents up 14% nationally — agents need a heads-up\n\nForward as-is or strip the byline. Numbers source from the May briefing pack.\n\n— {{your_name}}' },
  { id: uid('s_'), title: 'Price Drop Alert template',     category: 'price_drop',       starred: false, use_count: 4,  created_at: daysAgo(45), body: 'Subject: Price drop on {{address}} — now {{new_price}}\n\nQuick heads up — {{address}} just adjusted to {{new_price}} (down from {{old_price}}). Listing has been on market {{dom}} days.\n\nIf this matches what you were looking for, I can set up a tour this week.' },
  { id: uid('s_'), title: 'Property Shield fraud-prevention 1-pager', category: 'fraud_prevention', starred: true, use_count: 8, created_at: daysAgo(20), body: 'The 5 listing-fraud signals brokers see most often:\n\n1. Listing price >20% below comparable comps in zip\n2. "Owner deployed/missionary/out of country" language\n3. Wire-only or gift-card payment requests\n4. Photo reverse-search hits another listing in another city\n5. Address geocode mismatches photo backdrop\n\nProperty Shield flags all 5 automatically. Forward to your agents — every flagged listing they catch is a client they keep.' },
  { id: uid('s_'), title: 'Compliance nudge — listing accuracy', category: 'compliance', starred: false, use_count: 2, created_at: daysAgo(60), body: 'Friendly reminder: NAR Code of Ethics Article 12 requires accurate representation of property facts in marketing. Quick checklist your agents can run before publishing:\n\n☐ Square footage matches county assessor\n☐ Bedroom/bath count matches listing source of truth\n☐ Photos taken within last 90 days\n☐ Price reflects current owner agreement\n\n5 minutes per listing saves a complaint.' },
  { id: uid('s_'), title: 'Spring season — buyer urgency cue', category: 'seasonal', starred: false, use_count: 3, created_at: daysAgo(15), body: 'Spring buying window data your agents can use this week:\n\n- 64% of annual home purchases close between April and August\n- Listings live <30 days are 2.3x more likely to sell at/above asking\n- Buyer search volume peaks the second week of May\n\nEncourage sellers to list now if they\'ve been waiting — late-spring inventory is when price discipline pays off.' },
  { id: uid('s_'), title: 'Webinar registration push',     category: 'webinar',          starred: false, use_count: 5,  created_at: daysAgo(10), body: 'Subject: 30 min that protects your agents from listing fraud (May 18 webinar)\n\nQuick invite — we\'re running our monthly broker workshop on May 18 at 2pm ET. 30 minutes, focus on the three fraud patterns we\'re seeing most this month and how to spot them before listings publish.\n\nRegister: {{webinar_link}}\n\nReplays go to all registrants whether you make it live or not.' },
]

export const seedWebinars: Webinar[] = [
  {
    id: uid('w_'),
    title: 'Spotting listing fraud before it goes live',
    date: daysAhead(17),
    brokerage_focus: 'all brokers',
    registrants: 42,
    attendees: 0,
    notes: 'May edition — focus on rental fraud patterns trending in Q2.',
    checklist: { reg_email_sent: true, reminder_sent: false, handout_sent: false, attendee_followup_sent: false, no_show_followup_sent: false },
    created_at: daysAgo(7),
  },
  {
    id: uid('w_'),
    title: 'Q2 market beat — bringing data to your agents',
    date: daysAhead(38),
    brokerage_focus: 'mid-size brokerages',
    registrants: 0,
    attendees: 0,
    notes: 'Drafting outline. Coordinating with research team for Q2 numbers.',
    checklist: { reg_email_sent: false, reminder_sent: false, handout_sent: false, attendee_followup_sent: false, no_show_followup_sent: false },
    created_at: daysAgo(2),
  },
  {
    id: uid('w_'),
    title: 'April recap — what brokers asked us most',
    date: daysAgo(12),
    brokerage_focus: 'all brokers',
    registrants: 67,
    attendees: 51,
    notes: 'Strong attendance. 16 no-shows need follow-up.',
    checklist: { reg_email_sent: true, reminder_sent: true, handout_sent: true, attendee_followup_sent: true, no_show_followup_sent: false },
    created_at: daysAgo(40),
  },
]
